const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  regNumber:    { type:String, required:true, unique:true, uppercase:true },
  type:         { type:String, enum:['truck','van','motorcycle','ship','plane'], default:'truck' },
  make:         { type:String },
  model:        { type:String },
  year:         { type:Number },
  capacity:     { type:Number, comment:'kg' },
  status:       { type:String, enum:['available','in_use','maintenance','retired'], default:'available' },
  driver:       { type:String },
  driverPhone:  { type:String },
  lastService:  { type:Date },
  nextService:  { type:Date },
  fuelType:     { type:String, enum:['petrol','diesel','electric','hybrid'], default:'diesel' },
  notes:        { type:String },
  createdBy:    { type:mongoose.Schema.Types.ObjectId, ref:'User' }
},{ timestamps:true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
