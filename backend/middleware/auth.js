const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

exports.protect = async (req,res,next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null;
    if(!token) return res.status(401).json({success:false,message:'Not authorized'});
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if(!user||!user.isActive) return res.status(401).json({success:false,message:'User not found or inactive'});
    req.user = user; next();
  } catch(e){ res.status(401).json({success:false,message:'Token invalid'}); }
};

exports.authorize = (...roles) => (req,res,next) => {
  if(!roles.includes(req.user.role)) return res.status(403).json({success:false,message:`Role '${req.user.role}' not authorized`});
  next();
};

exports.adminProtect = async (req,res,next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null;
    if(!token) return res.status(401).json({success:false,message:'Not authorized'});
    const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET||process.env.JWT_SECRET);
    if(!decoded.isAdmin) return res.status(403).json({success:false,message:'Admin access required'});
    const admin = await Admin.findById(decoded.id);
    if(!admin||!admin.isActive) return res.status(401).json({success:false,message:'Admin not found'});
    req.admin = admin; next();
  } catch(e){ res.status(401).json({success:false,message:'Token invalid'}); }
};

// superAdmin middleware removed — all admins have equal access
exports.superAdmin = (req,res,next) => next();
