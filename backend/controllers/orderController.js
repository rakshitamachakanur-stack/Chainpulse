const Order = require('../models/Order');
const notify = require('../middleware/notify');
const emit   = require('../middleware/socketEmit');

exports.getAll = async (req,res) => {
  try {
    const {status,priority,supplier,search,page=1,limit=10} = req.query;
    const filter = {};
    if(status)   filter.status=status;
    if(priority) filter.priority=priority;
    if(supplier) filter.supplier=supplier;
    if(search)   filter.orderNumber={$regex:search,$options:'i'};
    const total = await Order.countDocuments(filter);
    const data  = await Order.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(+limit)
      .populate('supplier','name code').populate('createdBy','name').populate('items.product','name sku');
    res.json({success:true,total,page:+page,pages:Math.ceil(total/limit),data});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.getOne = async (req,res) => {
  try {
    const o = await Order.findById(req.params.id)
      .populate('supplier').populate('createdBy','name email').populate('approvedBy','name').populate('items.product').populate('requisition','reqNumber');
    if(!o) return res.status(404).json({success:false,message:'Not found'});
    res.json({success:true,data:o});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.create = async (req,res) => {
  try {
    req.body.createdBy = req.user._id;
    req.body.timeline  = [{status:'pending', by:req.user._id, note:'Order created'}];
    const o = await Order.create(req.body);
    await o.populate(['supplier','items.product']);
    emit(req, 'order:created', { id:o._id, orderNumber:o.orderNumber, status:o.status });
    res.status(201).json({success:true,data:o});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

exports.update = async (req,res) => {
  try {
    const o = await Order.findById(req.params.id);
    if(!o) return res.status(404).json({success:false,message:'Not found'});
    if(req.body.status && req.body.status!==o.status){
      o.timeline.push({status:req.body.status, by:req.user._id, note:req.body.statusNote||''});
      if(req.body.status==='approved') o.approvedBy=req.user._id;
    }
    Object.assign(o,req.body); await o.save();
    await o.populate(['supplier','items.product','createdBy']);
    emit(req, 'order:updated', { id:o._id, orderNumber:o.orderNumber, status:o.status });
    res.json({success:true,data:o});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

exports.updateStatus = async (req,res) => {
  try {
    const {status,note} = req.body;
    const o = await Order.findById(req.params.id);
    if(!o) return res.status(404).json({success:false,message:'Not found'});
    o.status=status;
    o.timeline.push({status, by:req.user._id, note:note||''});
    if(status==='approved') o.approvedBy=req.user._id;
    await o.save();
    emit(req, 'order:updated', { id:o._id, orderNumber:o.orderNumber, status });
    res.json({success:true,data:o,message:`Order ${status}`});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

exports.remove = async (req,res) => {
  try {
    const o = await Order.findById(req.params.id);
    if(!o) return res.status(404).json({success:false,message:'Not found'});
    if(!['draft','cancelled'].includes(o.status)) return res.status(400).json({success:false,message:'Cannot delete active order'});
    await o.deleteOne();
    res.json({success:true,message:'Deleted'});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};
