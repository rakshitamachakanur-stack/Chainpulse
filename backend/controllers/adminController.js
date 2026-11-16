const User        = require('../models/User');
const Admin       = require('../models/Admin');
const Order       = require('../models/Order');
const Supplier    = require('../models/Supplier');
const Shipment    = require('../models/Shipment');
const Inventory   = require('../models/Inventory');
const Requisition = require('../models/Requisition');

exports.getStats = async (req,res) => {
  try {
    const [users,activeUsers,orders,suppliers,shipments,inventory,pending,lowStock] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({isActive:true}),
      Order.countDocuments(), Supplier.countDocuments(),
      Shipment.countDocuments(), Inventory.countDocuments(),
      Requisition.countDocuments({status:'pending'}),
      Inventory.countDocuments({status:{$in:['low_stock','out_of_stock']}})
    ]);
    res.json({success:true,data:{users,activeUsers,orders,suppliers,shipments,inventory,pendingReqs:pending,lowStock}});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.getUsers = async (req,res) => {
  try {
    const {page=1,limit=20,search,role,isActive} = req.query;
    const filter={};
    if(role) filter.role=role;
    if(isActive!==undefined) filter.isActive=isActive==='true';
    if(search) filter.$or=[{name:{$regex:search,$options:'i'}},{email:{$regex:search,$options:'i'}}];
    const total=await User.countDocuments(filter);
    const data=await User.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(+limit);
    res.json({success:true,total,page:+page,pages:Math.ceil(total/limit),data});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.createUser = async (req,res) => {
  try {
    if(await User.findOne({email:req.body.email})) return res.status(400).json({success:false,message:'Email exists'});
    const user=await User.create(req.body);
    res.status(201).json({success:true,data:user});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

exports.updateUser = async (req,res) => {
  try {
    const {password,...rest} = req.body;
    const user=await User.findByIdAndUpdate(req.params.id,rest,{new:true});
    if(!user) return res.status(404).json({success:false,message:'Not found'});
    res.json({success:true,data:user});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

exports.toggleUser = async (req,res) => {
  try {
    const user=await User.findById(req.params.id);
    if(!user) return res.status(404).json({success:false,message:'Not found'});
    user.isActive=!user.isActive; await user.save({validateBeforeSave:false});
    res.json({success:true,data:user,message:`User ${user.isActive?'activated':'deactivated'}`});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.deleteUser = async (req,res) => {
  try { await User.findByIdAndDelete(req.params.id); res.json({success:true,message:'Deleted'}); }
  catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.getAdmins = async (req,res) => {
  try { res.json({success:true,data:await Admin.find().sort({createdAt:-1})}); }
  catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.createAdmin = async (req,res) => {
  try {
    // Any authenticated admin can create another admin — superadmin role removed
    if(await Admin.findOne({email:req.body.email})) return res.status(400).json({success:false,message:'Email exists'});
    const payload = { ...req.body, role:'admin' }; // enforce role = admin always
    const admin=await Admin.create(payload);
    res.status(201).json({success:true,data:admin});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

exports.getAllOrders = async (req,res) => {
  try {
    const {page=1,limit=20,status}=req.query;
    const filter=status?{status}:{};
    const total=await Order.countDocuments(filter);
    const data=await Order.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(+limit).populate('supplier','name').populate('createdBy','name email');
    res.json({success:true,total,page:+page,pages:Math.ceil(total/limit),data});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.getActivity = async (req,res) => {
  try {
    const [orders,shipments,requisitions] = await Promise.all([
      Order.find().sort({updatedAt:-1}).limit(10).populate('createdBy','name').select('orderNumber status totalAmount updatedAt createdBy'),
      Shipment.find().sort({updatedAt:-1}).limit(10).populate('createdBy','name').select('trackingNumber status carrier updatedAt createdBy'),
      Requisition.find().sort({updatedAt:-1}).limit(10).populate('createdBy','name').select('reqNumber title status priority totalAmount updatedAt createdBy')
    ]);
    res.json({success:true,data:{orders,shipments,requisitions}});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};
