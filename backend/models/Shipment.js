const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  trackingNumber:  { type:String, unique:true },
  order:           { type:mongoose.Schema.Types.ObjectId, ref:'Order' },
  vehicle:         { type:mongoose.Schema.Types.ObjectId, ref:'Vehicle' },
  driver:          { type:String },
  carrier:         { type:String, required:true },
  serviceType:     { type:String, enum:['standard','express','freight','air','ocean'], default:'standard' },
  status:          { type:String, enum:['preparing','picked_up','in_transit','out_for_delivery','delivered','failed','returned'], default:'preparing' },
  origin:          { address:String, city:String, country:String, lat:Number, lng:Number },
  destination:     { address:String, city:String, country:String, lat:Number, lng:Number },
  currentLocation: { city:String, country:String, lat:Number, lng:Number, updatedAt:{ type:Date, default:Date.now } },
  estimatedDelivery:{ type:Date },
  actualDelivery:  { type:Date },
  weight:          { type:Number },
  packages:        { type:Number, default:1 },
  cost:            { type:Number, default:0 },
  proofOfDelivery: { type:String },
  events: [{
    status:      String,
    location:    String,
    description: String,
    timestamp:   { type:Date, default:Date.now }
  }],
  createdBy: { type:mongoose.Schema.Types.ObjectId, ref:'User' }
},{ timestamps:true });

shipmentSchema.pre('save', async function(next){
  if(!this.trackingNumber){
    const n = await mongoose.model('Shipment').countDocuments();
    this.trackingNumber = `CP${Date.now()}${String(n+1).padStart(3,'0')}`;
  }
  next();
});

module.exports = mongoose.model('Shipment', shipmentSchema);
