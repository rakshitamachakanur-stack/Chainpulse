const mongoose = require('mongoose');

const receiptItemSchema = new mongoose.Schema({
  product:          { type:mongoose.Schema.Types.ObjectId, ref:'Product', required:true },
  orderedQty:       { type:Number, required:true },
  receivedQty:      { type:Number, required:true },
  rejectedQty:      { type:Number, default:0 },
  rejectionReason:  { type:String },
  condition:        { type:String, enum:['good','damaged','expired'], default:'good' }
});

const goodsReceiptSchema = new mongoose.Schema({
  grnNumber:   { type:String, unique:true },
  order:       { type:mongoose.Schema.Types.ObjectId, ref:'Order', required:true },
  supplier:    { type:mongoose.Schema.Types.ObjectId, ref:'Supplier' },
  items:       [receiptItemSchema],
  status:      { type:String, enum:['draft','verified','rejected'], default:'draft' },
  receivedDate:{ type:Date, default:Date.now },
  notes:       { type:String },
  damageReport:{ type:String },
  verifiedBy:  { type:mongoose.Schema.Types.ObjectId, ref:'User' },
  createdBy:   { type:mongoose.Schema.Types.ObjectId, ref:'User' }
},{ timestamps:true });

goodsReceiptSchema.pre('save', async function(next){
  if(!this.grnNumber){
    const n = await mongoose.model('GoodsReceipt').countDocuments();
    this.grnNumber = `GRN-${new Date().getFullYear()}-${String(n+1).padStart(4,'0')}`;
  }
  next();
});

module.exports = mongoose.model('GoodsReceipt', goodsReceiptSchema);
