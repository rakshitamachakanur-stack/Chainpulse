const Requisition = require('../models/Requisition');
const Order = require('../models/Order');
const notify = require('../middleware/notify');
const emit   = require('../middleware/socketEmit');

exports.getAll = async (req,res) => {
  try {
    const {status,priority,page=1,limit=10,search} = req.query;
    const filter = {};
    // Procurement sees own; manager sees all
    if(req.user.role==='procurement') filter.createdBy = req.user._id;
    if(status)   filter.status = status;
    if(priority) filter.priority = priority;
    if(search)   filter.reqNumber = {$regex:search,$options:'i'};
    const total = await Requisition.countDocuments(filter);
    const data  = await Requisition.find(filter).sort({createdAt:-1})
      .skip((page-1)*limit).limit(+limit)
      .populate('items.product','name sku unitPrice')
      .populate('createdBy','name role')
      .populate('approvedBy','name');
    res.json({success:true,total,page:+page,pages:Math.ceil(total/limit),data});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.getOne = async (req,res) => {
  try {
    const r = await Requisition.findById(req.params.id)
      .populate('items.product')
      .populate('createdBy','name email role')
      .populate('approvedBy','name email')
      .populate('supplier','name code email')
      .populate('convertedTo','orderNumber status');
    if(!r) return res.status(404).json({success:false,message:'Not found'});
    res.json({success:true,data:r});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.create = async (req,res) => {
  try {
    req.body.createdBy = req.user._id;
    req.body.timeline  = [{status:'draft', by:req.user._id, note:'Requisition created'}];
    const r = await Requisition.create(req.body);
    res.status(201).json({success:true,data:r});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

exports.update = async (req,res) => {
  try {
    const r = await Requisition.findById(req.params.id);
    if(!r) return res.status(404).json({success:false,message:'Not found'});
    if(!['draft','pending'].includes(r.status)) return res.status(400).json({success:false,message:'Cannot edit after approval'});
    Object.assign(r, req.body); await r.save();
    res.json({success:true,data:r});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

exports.submit = async (req,res) => {
  try {
    const r = await Requisition.findById(req.params.id);
    if(!r) return res.status(404).json({success:false,message:'Not found'});
    if(r.status!=='draft') return res.status(400).json({success:false,message:'Already submitted'});
    r.status = 'pending';
    r.timeline.push({status:'pending', by:req.user._id, note:'Submitted for approval'});
    await r.save();
    await notify({ title:'New Purchase Requisition', message:`${req.user.name} submitted ${r.reqNumber} for approval`, type:'info', priority:r.priority==='critical'?'high':'medium', targetRole:'manager', refModel:'Requisition', refId:r._id, createdBy:req.user._id });
    emit(req, 'requisition:updated', { id:r._id, reqNumber:r.reqNumber, status:r.status });
    res.json({success:true,data:r,message:'Submitted for approval'});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

exports.approve = async (req,res) => {
  try {
    const {action, note} = req.body; // action: 'approve' | 'reject'
    const r = await Requisition.findById(req.params.id);
    if(!r) return res.status(404).json({success:false,message:'Not found'});
    if(r.status!=='pending') return res.status(400).json({success:false,message:'Not pending approval'});
    r.status      = action==='approve' ? 'approved' : 'rejected';
    r.approvedBy  = req.user._id;
    r.approvalNote= note||'';
    r.approvedAt  = new Date();
    r.timeline.push({status:r.status, by:req.user._id, note:note||''});
    await r.save();
    await notify({ title:`Requisition ${r.status}`, message:`${r.reqNumber} was ${r.status} by ${req.user.name}. ${note||''}`, type:action==='approve'?'order_approved':'order_rejected', targetUser:r.createdBy, refModel:'Requisition', refId:r._id, createdBy:req.user._id });
    emit(req, 'requisition:updated', { id:r._id, reqNumber:r.reqNumber, status:r.status });
    res.json({success:true,data:r,message:`Requisition ${r.status}`});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

exports.convertToPO = async (req,res) => {
  try {
    const r = await Requisition.findById(req.params.id).populate('items.product');
    if(!r) return res.status(404).json({success:false,message:'Not found'});
    if(r.status!=='approved') return res.status(400).json({success:false,message:'Requisition must be approved first'});
    if(r.convertedTo) return res.status(400).json({success:false,message:'Already converted to PO'});
    const items = r.items.map(i=>({ product:i.product._id, quantity:i.quantity, unitPrice:i.unitPrice||i.product.unitPrice, totalPrice:i.quantity*(i.unitPrice||i.product.unitPrice) }));
    const total = items.reduce((s,i)=>s+i.totalPrice,0);
    const order = await Order.create({
      supplier:r.supplier||req.body.supplier, items, totalAmount:total,
      priority:r.priority, requisition:r._id, notes:r.justification,
      expectedDelivery:r.neededBy,
      createdBy:req.user._id,
      timeline:[{status:'pending', by:req.user._id, note:`Converted from ${r.reqNumber}`}]
    });
    r.status='converted'; r.convertedTo=order._id;
    r.timeline.push({status:'converted', by:req.user._id, note:`PO ${order.orderNumber} created`});
    await r.save();
    emit(req, 'requisition:updated', { id:r._id, reqNumber:r.reqNumber, status:'converted' });
    emit(req, 'order:created', { id:order._id, orderNumber:order.orderNumber, status:'pending' });
    res.json({success:true,data:order,message:`Purchase Order ${order.orderNumber} created`});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

exports.remove = async (req,res) => {
  try {
    const r = await Requisition.findById(req.params.id);
    if(!r) return res.status(404).json({success:false,message:'Not found'});
    if(!['draft','rejected'].includes(r.status)) return res.status(400).json({success:false,message:'Cannot delete'});
    await r.deleteOne();
    res.json({success:true,message:'Deleted'});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};
