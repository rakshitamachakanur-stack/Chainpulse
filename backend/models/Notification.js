const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title:      { type:String, required:true },
  message:    { type:String, required:true },
  type:       { type:String, enum:['low_stock','order_approved','order_rejected','shipment_update','delivery_done','system','info'], default:'info' },
  priority:   { type:String, enum:['low','medium','high'], default:'medium' },
  targetRole: { type:String, enum:['all','manager','procurement','warehouse','logistics'] },
  targetUser: { type:mongoose.Schema.Types.ObjectId, ref:'User' },
  refModel:   { type:String },
  refId:      { type:mongoose.Schema.Types.ObjectId },
  isRead:     { type:Boolean, default:false },
  readBy:     [{ user:{ type:mongoose.Schema.Types.ObjectId, ref:'User' }, at:{ type:Date } }],
  createdBy:  { type:mongoose.Schema.Types.ObjectId, ref:'User' }
},{ timestamps:true });

module.exports = mongoose.model('Notification', notificationSchema);
