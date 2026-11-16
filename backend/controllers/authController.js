const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

const signToken = (id,secret,expire) => jwt.sign({id},secret,{expiresIn:expire||'7d'});

exports.register = async (req,res) => {
  try {
    const {name,email,password,role,phone,department} = req.body;
    if(await User.findOne({email})) return res.status(400).json({success:false,message:'Email already registered'});
    const user = await User.create({name,email,password,role,phone,department});
    const token = signToken(user._id, process.env.JWT_SECRET);
    res.status(201).json({success:true,token,data:user});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

exports.login = async (req,res) => {
  try {
    const email = String(req.body.email||'').trim().toLowerCase();
    const password = req.body.password;
    if(!email||!password) return res.status(400).json({success:false,message:'Email and password required'});
    const user = await User.findOne({email}).select('+password');
    if(!user||!(await user.comparePassword(password))) return res.status(401).json({success:false,message:'Invalid credentials'});
    if(!user.isActive) return res.status(401).json({success:false,message:'Account deactivated'});
    user.lastLogin = new Date(); await user.save({validateBeforeSave:false});
    const token = signToken(user._id, process.env.JWT_SECRET);
    res.json({success:true,token,data:user});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.getMe = async (req,res) => res.json({success:true,data:req.user});

exports.updatePassword = async (req,res) => {
  try {
    const {currentPassword,newPassword} = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if(!(await user.comparePassword(currentPassword))) return res.status(401).json({success:false,message:'Current password incorrect'});
    user.password = newPassword; await user.save();
    const token = signToken(user._id, process.env.JWT_SECRET);
    res.json({success:true,token,message:'Password updated'});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

exports.adminLogin = async (req,res) => {
  try {
    const email = String(req.body.email||'').trim().toLowerCase();
    const password = req.body.password;
    if(!email||!password) return res.status(400).json({success:false,message:'Email and password required'});
    const admin = await Admin.findOne({email}).select('+password');
    if(!admin||!(await admin.comparePassword(password))) return res.status(401).json({success:false,message:'Invalid admin credentials'});
    if(!admin.isActive) return res.status(401).json({success:false,message:'Admin deactivated'});
    admin.lastLogin = new Date(); await admin.save({validateBeforeSave:false});
    const token = jwt.sign({id:admin._id,isAdmin:true}, process.env.JWT_ADMIN_SECRET||process.env.JWT_SECRET, {expiresIn:'1d'});
    res.json({success:true,token,data:admin});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.getAdminMe = async (req,res) => res.json({success:true,data:req.admin});
