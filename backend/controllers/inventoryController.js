const Inventory = require('../models/Inventory');
const notify    = require('../middleware/notify');
const emit      = require('../middleware/socketEmit');

exports.getAll = async (req,res) => {
  try {
    const {status,search,page=1,limit=15} = req.query;
    const filter = {};
    if(status) filter.status=status;
    const total = await Inventory.countDocuments(filter);
    let q = Inventory.find(filter).sort({updatedAt:-1}).skip((page-1)*limit).limit(+limit)
      .populate({path:'product', match: search?{name:{$regex:search,$options:'i'}}:{}});
    const data = (await q).filter(i=>i.product);
    res.json({success:true,total,page:+page,pages:Math.ceil(total/limit),data});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.getOne = async (req,res) => {
  try {
    const i = await Inventory.findById(req.params.id).populate('product');
    if(!i) return res.status(404).json({success:false,message:'Not found'});
    res.json({success:true,data:i});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.create = async (req,res) => {
  try {
    if(await Inventory.findOne({product:req.body.product})) return res.status(400).json({success:false,message:'Already exists'});
    const i = await Inventory.create(req.body);
    await i.populate('product');
    res.status(201).json({success:true,data:i});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

exports.update = async (req,res) => {
  try {
    const i = await Inventory.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true}).populate('product');
    if(!i) return res.status(404).json({success:false,message:'Not found'});
    res.json({success:true,data:i});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

exports.adjust = async (req,res) => {
  try {
    const {type,quantity,reference,note} = req.body;
    const i = await Inventory.findById(req.params.id);
    if(!i) return res.status(404).json({success:false,message:'Not found'});
    if(type==='in')         i.quantity+=quantity;
    else if(type==='out'){  if(i.quantity<quantity) return res.status(400).json({success:false,message:'Insufficient stock'}); i.quantity-=quantity; }
    else if(type==='adjustment') i.quantity=quantity;
    i.transactions.push({type,quantity,reference,note,by:req.user._id});
    if(type==='in') i.lastReceived=new Date();
    await i.save();
    // Auto-notify if low after adjustment
    if(['low_stock','out_of_stock'].includes(i.status)){
      await notify({ title:`Low Stock Alert`, message:`${i.product||'Product'} is now ${i.status.replace('_',' ')} (qty: ${i.quantity})`, type:'low_stock', priority:'high', targetRole:'procurement', refModel:'Inventory', refId:i._id, createdBy:req.user._id });
    }
    await i.populate('product');
    emit(req, 'inventory:updated', { id: i._id, status: i.status, quantity: i.quantity });
    res.json({success:true,data:i,message:'Stock adjusted'});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

exports.getLowStock = async (req,res) => {
  try {
    const data = await Inventory.find({status:{$in:['low_stock','out_of_stock']}}).populate('product');
    res.json({success:true,count:data.length,data});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};
