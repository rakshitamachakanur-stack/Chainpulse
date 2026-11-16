const mongoose = require('mongoose');

const requisitionItemSchema = new mongoose.Schema({
  product:     { type:mongoose.Schema.Types.ObjectId, ref:'Product', required:true },
  quantity:    { type:Number, required:true, min:1 },
  unitPrice:   { type:Number, default:0 },
  totalPrice:  { type:Number, default:0 },
  notes:       { type:String }
});

const requisitionSchema = new mongoose.Schema({
  reqNumber:   { type:String, unique:true },
  title:       { type:String, required:true },
  items:       [requisitionItemSchema],
  totalAmount: { type:Number, default:0 },
  status:      { type:String, enum:['draft','pending','approved','rejected','converted'], default:'draft' },
  priority:    { type:String, enum:['low','medium','high','critical'], default:'medium' },
  justification:{ type:String },
  neededBy:    { type:Date },
  supplier:    { type:mongoose.Schema.Types.ObjectId, ref:'Supplier' },
  approvedBy:  { type:mongoose.Schema.Types.ObjectId, ref:'User' },
  approvalNote:{ type:String },
  approvedAt:  { type:Date },
  convertedTo: { type:mongoose.Schema.Types.ObjectId, ref:'Order' },
  createdBy:   { type:mongoose.Schema.Types.ObjectId, ref:'User' },
  timeline:    [{ status:String, note:String, by:{ type:mongoose.Schema.Types.ObjectId, ref:'User' }, at:{ type:Date, default:Date.now } }]
},{ timestamps:true });

requisitionSchema.pre('save', async function(next){
  if(!this.reqNumber){
    const n = await mongoose.model('Requisition').countDocuments();
    const d = new Date();
    this.reqNumber = `REQ-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${String(n+1).padStart(4,'0')}`;
  }
  next();
});

module.exports = mongoose.model('Requisition', requisitionSchema);
