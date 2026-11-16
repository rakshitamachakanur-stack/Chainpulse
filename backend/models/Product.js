const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  sku:         { type:String, unique:true, uppercase:true },
  name:        { type:String, required:true, trim:true },
  category:    { type:String, required:true },
  description: { type:String },
  unit:        { type:String, default:'piece', enum:['piece','kg','liter','meter','box','pallet'] },
  unitPrice:   { type:Number, required:true, min:0 },
  supplier:    { type:mongoose.Schema.Types.ObjectId, ref:'Supplier' },
  isActive:    { type:Boolean, default:true },
  createdBy:   { type:mongoose.Schema.Types.ObjectId, ref:'User' }
},{ timestamps:true });
module.exports = mongoose.model('Product', productSchema);
