const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:    { type:mongoose.Schema.Types.ObjectId, ref:'Product', required:true },
  quantity:   { type:Number, required:true, min:1 },
  unitPrice:  { type:Number, required:true },
  totalPrice: { type:Number, required:true },
  received:   { type:Number, default:0 }
});

const orderSchema = new mongoose.Schema({
  orderNumber:     { type:String, unique:true },
  requisition:     { type:mongoose.Schema.Types.ObjectId, ref:'Requisition' },
  supplier:        { type:mongoose.Schema.Types.ObjectId, ref:'Supplier', required:true },
  items:           [orderItemSchema],
  status:          { type:String, enum:['draft','pending','approved','processing','shipped','delivered','cancelled','returned'], default:'draft' },
  priority:        { type:String, enum:['low','medium','high','critical'], default:'medium' },
  totalAmount:     { type:Number, required:true },
  currency:        { type:String, default:'USD' },
  expectedDelivery:{ type:Date },
  actualDelivery:  { type:Date },
  paymentStatus:   { type:String, enum:['pending','partial','paid','overdue'], default:'pending' },
  shippingAddress: { street:String, city:String, state:String, country:String, zip:String },
  notes:           { type:String },
  timeline:        [{ status:String, note:String, by:{ type:mongoose.Schema.Types.ObjectId, ref:'User' }, at:{ type:Date, default:Date.now } }],
  createdBy:       { type:mongoose.Schema.Types.ObjectId, ref:'User' },
  approvedBy:      { type:mongoose.Schema.Types.ObjectId, ref:'User' }
},{ timestamps:true });

orderSchema.pre('save', async function(next){
  if(!this.orderNumber){
    const n = await mongoose.model('Order').countDocuments();
    const d = new Date();
    this.orderNumber = `PO-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${String(n+1).padStart(4,'0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
