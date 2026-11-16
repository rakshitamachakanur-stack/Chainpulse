const mongoose = require('mongoose');
const supplierSchema = new mongoose.Schema({
  code:         { type:String, unique:true, uppercase:true },
  name:         { type:String, required:true, trim:true },
  contactName:  { type:String, required:true },
  email:        { type:String, required:true },
  phone:        { type:String, required:true },
  address:      { street:String, city:String, state:String, country:String, zip:String },
  category:     { type:String, enum:['electronics','raw_material','packaging','logistics','services','other'], required:true },
  status:       { type:String, enum:['active','inactive','blacklisted'], default:'active' },
  rating:       { type:Number, min:0, max:5, default:0 },
  leadTime:     { type:Number, default:7 },
  paymentTerms: { type:String, default:'Net 30' },
  notes:        { type:String },
  createdBy:    { type:mongoose.Schema.Types.ObjectId, ref:'User' }
},{ timestamps:true });
module.exports = mongoose.model('Supplier', supplierSchema);
