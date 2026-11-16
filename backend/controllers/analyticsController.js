const Order        = require('../models/Order');
const Requisition  = require('../models/Requisition');
const Shipment     = require('../models/Shipment');
const Supplier     = require('../models/Supplier');
const Inventory    = require('../models/Inventory');
const Delivery     = require('../models/Delivery');
const User         = require('../models/User');

exports.dashboard = async (req,res) => {
  try {
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth  = new Date(now.getFullYear(), now.getMonth()-1, 1);
    const endLast    = new Date(now.getFullYear(), now.getMonth(), 0);

    const role = req.user.role;

    if(role==='procurement'){
      const [myReqs, pendingApproval, approvedReqs, myOrders, totalSpend] = await Promise.all([
        Requisition.countDocuments({createdBy:req.user._id}),
        Requisition.countDocuments({createdBy:req.user._id, status:'pending'}),
        Requisition.countDocuments({createdBy:req.user._id, status:'approved'}),
        Order.countDocuments({createdBy:req.user._id}),
        Order.aggregate([{$match:{createdBy:req.user._id,status:{$nin:['cancelled']}}},{$group:{_id:null,total:{$sum:'$totalAmount'}}}])
      ]);
      const recentReqs = await Requisition.find({createdBy:req.user._id}).sort({createdAt:-1}).limit(5).populate('items.product','name');
      return res.json({success:true, data:{role:'procurement', kpis:{myReqs,pendingApproval,approvedReqs,myOrders,totalSpend:totalSpend[0]?.total||0}, recentReqs}});
    }

    if(role==='warehouse'){
      const [totalItems, lowStock, outOfStock, pendingReceipts, inStock] = await Promise.all([
        Inventory.countDocuments(),
        Inventory.countDocuments({status:'low_stock'}),
        Inventory.countDocuments({status:'out_of_stock'}),
        Order.countDocuments({status:{$in:['approved','processing','shipped']}}),
        Inventory.countDocuments({status:'in_stock'})
      ]);
      const lowStockItems = await Inventory.find({status:{$in:['low_stock','out_of_stock']}}).populate('product','name sku').limit(8);
      return res.json({success:true, data:{role:'warehouse', kpis:{totalItems,lowStock,outOfStock,pendingReceipts,inStock}, lowStockItems}});
    }

    if(role==='logistics'){
      const [active, delivered, delayed, vehicles] = await Promise.all([
        Shipment.countDocuments({status:{$in:['in_transit','out_for_delivery','picked_up']}}),
        Shipment.countDocuments({status:'delivered', updatedAt:{$gte:startMonth}}),
        Shipment.countDocuments({status:{$in:['in_transit']}, estimatedDelivery:{$lt:now}}),
        require('../models/Vehicle').countDocuments({status:'available'})
      ]);
      const recentShipments = await Shipment.find().sort({updatedAt:-1}).limit(6).populate('order','orderNumber');
      return res.json({success:true, data:{role:'logistics', kpis:{active,delivered,delayed,availableVehicles:vehicles}, recentShipments}});
    }

    if(role==='manager'){
      const [totalOrders, pendingApprovals, revenueArr, lastRevArr, inTransit, lowStockCount] = await Promise.all([
        Order.countDocuments({createdAt:{$gte:startMonth}}),
        Requisition.countDocuments({status:'pending'}),
        Order.aggregate([{$match:{createdAt:{$gte:startMonth},status:{$nin:['cancelled']}}},{$group:{_id:null,t:{$sum:'$totalAmount'}}}]),
        Order.aggregate([{$match:{createdAt:{$gte:lastMonth,$lte:endLast},status:{$nin:['cancelled']}}},{$group:{_id:null,t:{$sum:'$totalAmount'}}}]),
        Shipment.countDocuments({status:{$in:['in_transit','out_for_delivery']}}),
        Inventory.countDocuments({status:{$in:['low_stock','out_of_stock']}})
      ]);
      const revenueTrend = await Order.aggregate([
        {$match:{createdAt:{$gte:new Date(now.getFullYear(),now.getMonth()-5,1)},status:{$nin:['cancelled']}}},
        {$group:{_id:{y:{$year:'$createdAt'},m:{$month:'$createdAt'}},revenue:{$sum:'$totalAmount'},orders:{$sum:1}}},
        {$sort:{'_id.y':1,'_id.m':1}}
      ]);
      const topSuppliers = await Order.aggregate([
        {$match:{status:{$nin:['cancelled']}}},{$group:{_id:'$supplier',value:{$sum:'$totalAmount'},count:{$sum:1}}},
        {$sort:{value:-1}},{$limit:5},{$lookup:{from:'suppliers',localField:'_id',foreignField:'_id',as:'s'}},{$unwind:'$s'}
      ]);
      const orderStatus = await Order.aggregate([{$group:{_id:'$status',count:{$sum:1}}}]);
      return res.json({success:true, data:{role:'manager', kpis:{totalOrders,pendingApprovals,revenue:revenueArr[0]?.t||0,lastRevenue:lastRevArr[0]?.t||0,inTransit,lowStockCount}, revenueTrend, topSuppliers, orderStatus}});
    }

    res.json({success:true,data:{role}});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};
