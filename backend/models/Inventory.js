const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product:      { type:mongoose.Schema.Types.ObjectId, ref:'Product', required:true, unique:true },
  warehouse:    { type:String, default:'Main Warehouse' },
  quantity:     { type:Number, default:0, min:0 },
  reserved:     { type:Number, default:0 },
  available:    { type:Number, default:0 },
  reorderPoint: { type:Number, default:10 },
  reorderQty:   { type:Number, default:50 },
  maxStock:     { type:Number, default:500 },
  location:     { aisle:String, shelf:String, bin:String },
  status:       { type:String, enum:['in_stock','low_stock','out_of_stock','overstock'], default:'in_stock' },
  lastReceived: { type:Date },
  lastCounted:  { type:Date },
  transactions: [{
    type:      { type:String, enum:['in','out','adjustment','transfer','return'] },
    quantity:  Number,
    reference: String,
    note:      String,
    by:        { type:mongoose.Schema.Types.ObjectId, ref:'User' },
    at:        { type:Date, default:Date.now }
  }]
},{ timestamps:true });

inventorySchema.pre('save', function(next){
  this.available = this.quantity - this.reserved;
  if(this.quantity===0)                      this.status='out_of_stock';
  else if(this.quantity<=this.reorderPoint)  this.status='low_stock';
  else if(this.quantity>=this.maxStock)      this.status='overstock';
  else                                       this.status='in_stock';
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);
