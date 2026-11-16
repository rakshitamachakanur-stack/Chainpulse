const GoodsReceipt = require('../models/GoodsReceipt');
const Inventory    = require('../models/Inventory');
const Order        = require('../models/Order');
const notify       = require('../middleware/notify');
const emit         = require('../middleware/socketEmit');

exports.getAll = async (req,res) => {
  try {
    const {status,page=1,limit=10} = req.query;
    const filter = status ? {status} : {};
    const total = await GoodsReceipt.countDocuments(filter);
    const data  = await GoodsReceipt.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(+limit)
      .populate('order','orderNumber').populate('supplier','name').populate('createdBy','name');
    res.json({success:true,total,page:+page,pages:Math.ceil(total/limit),data});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.getOne = async (req,res) => {
  try {
    const r = await GoodsReceipt.findById(req.params.id)
      .populate('order').populate('supplier').populate('items.product').populate('createdBy','name').populate('verifiedBy','name');
    if(!r) return res.status(404).json({success:false,message:'Not found'});
    res.json({success:true,data:r});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.create = async (req,res) => {
  try {
    req.body.createdBy = req.user._id;
    const r = await GoodsReceipt.create(req.body);
    res.status(201).json({success:true,data:r});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

exports.verify = async (req,res) => {
  try {
    const r = await GoodsReceipt.findById(req.params.id).populate('items.product');
    if(!r) return res.status(404).json({success:false,message:'Not found'});
    if(r.status!=='draft') return res.status(400).json({success:false,message:'Already verified'});

    // Update inventory for each received item
    for(const item of r.items){
      if(item.condition==='good' && item.receivedQty>0){
        let inv = await Inventory.findOne({product:item.product._id||item.product});
        if(inv){
          inv.quantity += item.receivedQty;
          inv.transactions.push({type:'in', quantity:item.receivedQty, reference:r.grnNumber, note:'Goods received', by:req.user._id});
          inv.lastReceived = new Date();
          await inv.save();
        }
      }
    }

    r.status     = 'verified';
    r.verifiedBy = req.user._id;
    await r.save();

    // Update linked order status
    if(r.order){
      await Order.findByIdAndUpdate(r.order,{status:'delivered', actualDelivery:new Date()});
    }

    await notify({ title:'Goods Received & Verified', message:`GRN ${r.grnNumber} verified. Inventory updated.`, type:'info', targetRole:'procurement', refModel:'GoodsReceipt', refId:r._id, createdBy:req.user._id });

    emit(req, 'inventory:updated', { grnNumber: r.grnNumber });
    emit(req, 'order:updated',     { id: r.order, status: 'delivered' });

    res.json({success:true,data:r,message:'Goods verified and inventory updated'});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};
