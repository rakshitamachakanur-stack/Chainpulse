const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  deliveryNumber:  { type:String, unique:true },
  shipment:        { type:mongoose.Schema.Types.ObjectId, ref:'Shipment', required:true },
  order:           { type:mongoose.Schema.Types.ObjectId, ref:'Order' },
  vehicle:         { type:mongoose.Schema.Types.ObjectId, ref:'Vehicle' },
  driver:          { type:String },
  status:          { type:String, enum:['scheduled','dispatched','in_transit','delivered','failed','returned'], default:'scheduled' },
  scheduledDate:   { type:Date },
  deliveredAt:     { type:Date },
  recipient:       { name:String, phone:String, address:String },
  proofOfDelivery: { type:String },
  signature:       { type:String },
  notes:           { type:String },
  failureReason:   { type:String },
  createdBy:       { type:mongoose.Schema.Types.ObjectId, ref:'User' }
},{ timestamps:true });

deliverySchema.pre('save', async function(next){
  if(!this.deliveryNumber){
    const n = await mongoose.model('Delivery').countDocuments();
    this.deliveryNumber = `DEL-${new Date().getFullYear()}-${String(n+1).padStart(4,'0')}`;
  }
  next();
});

module.exports = mongoose.model('Delivery', deliverySchema);
