const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name:      { type:String, required:true },
  email:     { type:String, required:true, unique:true, lowercase:true },
  password:  { type:String, required:true, select:false },
  role:      { type:String, enum:['admin'], default:'admin' },
  isActive:  { type:Boolean, default:true },
  lastLogin: { type:Date },
},{ timestamps:true });

adminSchema.pre('save', async function(next) {
  if(!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12); next();
});
adminSchema.methods.comparePassword = function(pw) { return bcrypt.compare(pw, this.password); };
adminSchema.methods.toJSON = function() { const o=this.toObject(); delete o.password; return o; };

module.exports = mongoose.model('Admin', adminSchema);
