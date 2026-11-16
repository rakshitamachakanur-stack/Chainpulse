// ─── shipmentController.js ───────────────────────────────────────────────────
const Shipment = require('../models/Shipment');
const emit     = require('../middleware/socketEmit');

const CITY_COORDS = {
  'san jose': { lat: 37.3382, lng: -121.8863 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'chicago': { lat: 41.8781, lng: -87.6298 },
  'las vegas': { lat: 36.1699, lng: -115.1398 },
  'dallas': { lat: 32.7767, lng: -96.7970 },
  'phoenix': { lat: 33.4484, lng: -112.0740 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'seattle': { lat: 47.6062, lng: -122.3321 },
  'new york': { lat: 40.7128, lng: -74.0060 },
  'detroit': { lat: 42.3314, lng: -83.0458 },
  'denver': { lat: 39.7392, lng: -104.9903 },
  'fresno': { lat: 36.7468, lng: -119.7726 }
};

const resolveCoord = (obj) => {
  if (!obj || !obj.city) return obj;
  if (!obj.lat || !obj.lng) {
    const key = obj.city.toLowerCase().trim();
    if (CITY_COORDS[key]) {
      obj.lat = CITY_COORDS[key].lat;
      obj.lng = CITY_COORDS[key].lng;
    }
  }
  return obj;
};

exports.shipmentGetAll = async (req,res) => {
  try {
    const {status,page=1,limit=10,search} = req.query;
    const filter = {};
    if(status) filter.status=status;
    if(search) filter.trackingNumber={$regex:search,$options:'i'};
    const total = await Shipment.countDocuments(filter);
    const data  = await Shipment.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(+limit)
      .populate('order','orderNumber').populate('vehicle','regNumber type').populate('createdBy','name');
    res.json({success:true,total,page:+page,pages:Math.ceil(total/limit),data});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.shipmentGetOne = async (req,res) => {
  try {
    const s = await Shipment.findById(req.params.id).populate('order').populate('vehicle').populate('createdBy','name');
    if(!s) return res.status(404).json({success:false,message:'Not found'});
    res.json({success:true,data:s});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.shipmentTrack = async (req,res) => {
  try {
    const s = await Shipment.findOne({trackingNumber:req.params.tn}).populate('order','orderNumber');
    if(!s) return res.status(404).json({success:false,message:'Tracking number not found'});
    res.json({success:true,data:s});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.shipmentCreate = async (req,res) => {
  try {
    req.body.createdBy = req.user._id;
    if (req.body.origin) resolveCoord(req.body.origin);
    if (req.body.destination) resolveCoord(req.body.destination);
    if (!req.body.currentLocation && req.body.origin) {
      req.body.currentLocation = {
        city: req.body.origin.city,
        country: req.body.origin.country,
        lat: req.body.origin.lat,
        lng: req.body.origin.lng,
        updatedAt: new Date()
      };
    }
    req.body.events = [{status:'preparing', location:req.body.origin?.city||'Origin', description:'Shipment created'}];
    const s = await Shipment.create(req.body);
    emit(req, 'shipment:created', { id:s._id, trackingNumber:s.trackingNumber, status:s.status });
    res.status(201).json({success:true,data:s});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

exports.shipmentUpdate = async (req,res) => {
  try {
    const s = await Shipment.findById(req.params.id);
    if(!s) return res.status(404).json({success:false,message:'Not found'});
    if(req.body.status && req.body.status!==s.status){
      s.events.push({status:req.body.status, location:req.body.currentLocation?.city||'Unknown', description:req.body.eventDescription||`Status: ${req.body.status}`});
      if(req.body.status==='delivered') s.actualDelivery=new Date();
    }
    Object.assign(s,req.body); await s.save();
    emit(req, 'shipment:updated', { id:s._id, trackingNumber:s.trackingNumber, status:s.status, currentLocation:s.currentLocation });
    res.json({success:true,data:s});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

exports.shipmentUpdateLocation = async (req,res) => {
  try {
    const { lat, lng, city, speed } = req.body;
    const s = await Shipment.findById(req.params.id);
    if(!s) return res.status(404).json({success:false,message:'Not found'});
    s.currentLocation = {
      lat: Number(lat),
      lng: Number(lng),
      city: city || s.currentLocation?.city || 'In Transit',
      country: s.currentLocation?.country || 'USA',
      updatedAt: new Date()
    };
    await s.save();
    emit(req, 'shipment:location', {
      id: s._id,
      trackingNumber: s.trackingNumber,
      carrier: s.carrier,
      driver: s.driver,
      status: s.status,
      currentLocation: s.currentLocation,
      speed: speed || 62
    });
    res.json({success:true, data:s.currentLocation});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

exports.shipmentSimulateTick = async (req,res) => {
  try {
    const active = await Shipment.find({ status: { $in: ['in_transit', 'out_for_delivery'] } });
    const updated = [];
    for (const s of active) {
      if (!s.origin?.lat) resolveCoord(s.origin);
      if (!s.destination?.lat) resolveCoord(s.destination);
      if (!s.currentLocation?.lat) {
        s.currentLocation = {
          city: s.origin?.city || 'Origin',
          lat: s.origin?.lat || 37.33,
          lng: s.origin?.lng || -121.89,
          updatedAt: new Date()
        };
      }
      
      const targetLat = s.destination?.lat || s.currentLocation.lat;
      const targetLng = s.destination?.lng || s.currentLocation.lng;
      const dLat = targetLat - s.currentLocation.lat;
      const dLng = targetLng - s.currentLocation.lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);

      if (dist > 0.05) {
        // Step 4% towards destination
        s.currentLocation.lat += dLat * 0.05;
        s.currentLocation.lng += dLng * 0.05;
        s.currentLocation.updatedAt = new Date();
      } else {
        s.currentLocation.lat = targetLat;
        s.currentLocation.lng = targetLng;
        if (s.status === 'in_transit') s.status = 'out_for_delivery';
      }
      await s.save();

      const payload = {
        id: s._id,
        trackingNumber: s.trackingNumber,
        carrier: s.carrier,
        driver: s.driver,
        status: s.status,
        currentLocation: s.currentLocation,
        origin: s.origin,
        destination: s.destination,
        speed: Math.floor(54 + Math.random() * 15)
      };
      emit(req, 'shipment:location', payload);
      updated.push(payload);
    }
    res.json({ success: true, count: updated.length, data: updated });
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.shipmentDelete = async (req,res) => {
  try {
    await Shipment.findByIdAndDelete(req.params.id);
    res.json({success:true,message:'Deleted'});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

// ─── vehicleController.js ─────────────────────────────────────────────────────
const Vehicle = require('../models/Vehicle');

exports.vehicleGetAll = async (req,res) => {
  try {
    const {status} = req.query;
    const filter = status?{status}:{};
    const data = await Vehicle.find(filter).sort({createdAt:-1});
    res.json({success:true,count:data.length,data});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};
exports.vehicleGetOne = async (req,res) => {
  try {
    const v = await Vehicle.findById(req.params.id);
    if(!v) return res.status(404).json({success:false,message:'Not found'});
    res.json({success:true,data:v});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};
exports.vehicleCreate = async (req,res) => {
  try { req.body.createdBy=req.user._id; const v=await Vehicle.create(req.body); res.status(201).json({success:true,data:v}); }
  catch(e){ res.status(400).json({success:false,message:e.message}); }
};
exports.vehicleUpdate = async (req,res) => {
  try { const v=await Vehicle.findByIdAndUpdate(req.params.id,req.body,{new:true}); res.json({success:true,data:v}); }
  catch(e){ res.status(400).json({success:false,message:e.message}); }
};
exports.vehicleDelete = async (req,res) => {
  try { await Vehicle.findByIdAndDelete(req.params.id); res.json({success:true,message:'Deleted'}); }
  catch(e){ res.status(500).json({success:false,message:e.message}); }
};

// ─── deliveryController.js ────────────────────────────────────────────────────
const Delivery = require('../models/Delivery');
const notifyD  = require('../middleware/notify');

exports.deliveryGetAll = async (req,res) => {
  try {
    const {status,page=1,limit=10} = req.query;
    const filter = status?{status}:{};
    const total = await Delivery.countDocuments(filter);
    const data  = await Delivery.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(+limit)
      .populate('shipment','trackingNumber').populate('vehicle','regNumber').populate('createdBy','name');
    res.json({success:true,total,page:+page,pages:Math.ceil(total/limit),data});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};
exports.deliveryGetOne = async (req,res) => {
  try {
    const d=await Delivery.findById(req.params.id).populate('shipment').populate('vehicle').populate('order');
    if(!d) return res.status(404).json({success:false,message:'Not found'});
    res.json({success:true,data:d});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};
exports.deliveryCreate = async (req,res) => {
  try { req.body.createdBy=req.user._id; const d=await Delivery.create(req.body); res.status(201).json({success:true,data:d}); }
  catch(e){ res.status(400).json({success:false,message:e.message}); }
};
exports.deliveryUpdate = async (req,res) => {
  try {
    const d=await Delivery.findById(req.params.id);
    if(!d) return res.status(404).json({success:false,message:'Not found'});
    if(req.body.status==='delivered'){ d.deliveredAt=new Date(); await notifyD({title:'Delivery Completed',message:`Delivery ${d.deliveryNumber} confirmed`,type:'delivery_done',targetRole:'manager',refModel:'Delivery',refId:d._id,createdBy:req.user._id}); }
    Object.assign(d,req.body); await d.save();
    res.json({success:true,data:d});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};

// ─── notificationController.js ───────────────────────────────────────────────
const Notification = require('../models/Notification');

exports.getMyNotifications = async (req,res) => {
  try {
    const filter = { $or:[{targetUser:req.user._id},{targetRole:req.user.role},{targetRole:'all'}] };
    const data = await Notification.find(filter).sort({createdAt:-1}).limit(50);
    const unread = data.filter(n=>!n.readBy?.some(r=>r.user?.toString()===req.user._id.toString())).length;
    res.json({success:true,unread,data});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.markRead = async (req,res) => {
  try {
    const n=await Notification.findById(req.params.id);
    if(!n) return res.status(404).json({success:false,message:'Not found'});
    if(!n.readBy.some(r=>r.user?.toString()===req.user._id.toString())) n.readBy.push({user:req.user._id,at:new Date()});
    await n.save();
    res.json({success:true,message:'Marked as read'});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

exports.markAllRead = async (req,res) => {
  try {
    const filter = { $or:[{targetUser:req.user._id},{targetRole:req.user.role},{targetRole:'all'}], 'readBy.user':{$ne:req.user._id} };
    const notifs = await Notification.find(filter);
    for(const n of notifs){ n.readBy.push({user:req.user._id,at:new Date()}); await n.save(); }
    res.json({success:true,message:'All marked as read'});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};

// ─── supplierController.js ────────────────────────────────────────────────────
const Supplier = require('../models/Supplier');

exports.supplierGetAll = async (req,res) => {
  try {
    const {status,category,search,page=1,limit=10} = req.query;
    const filter = {};
    if(status)   filter.status=status;
    if(category) filter.category=category;
    if(search)   filter.$or=[{name:{$regex:search,$options:'i'}},{code:{$regex:search,$options:'i'}}];
    const total=await Supplier.countDocuments(filter);
    const data=await Supplier.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(+limit);
    res.json({success:true,total,page:+page,pages:Math.ceil(total/limit),data});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};
exports.supplierGetOne = async (req,res) => {
  try { const s=await Supplier.findById(req.params.id); if(!s) return res.status(404).json({success:false,message:'Not found'}); res.json({success:true,data:s}); }
  catch(e){ res.status(500).json({success:false,message:e.message}); }
};
exports.supplierCreate = async (req,res) => {
  try {
    const n=await Supplier.countDocuments();
    req.body.code=`SUP${String(n+1).padStart(4,'0')}`; req.body.createdBy=req.user._id;
    const s=await Supplier.create(req.body); res.status(201).json({success:true,data:s});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};
exports.supplierUpdate = async (req,res) => {
  try { const s=await Supplier.findByIdAndUpdate(req.params.id,req.body,{new:true}); res.json({success:true,data:s}); }
  catch(e){ res.status(400).json({success:false,message:e.message}); }
};
exports.supplierDelete = async (req,res) => {
  try { await Supplier.findByIdAndDelete(req.params.id); res.json({success:true,message:'Deleted'}); }
  catch(e){ res.status(500).json({success:false,message:e.message}); }
};

// ─── productController.js ─────────────────────────────────────────────────────
const Product = require('../models/Product');

exports.productGetAll = async (req,res) => {
  try {
    const {category,search,page=1,limit=10} = req.query;
    const filter = {};
    if(category) filter.category=category;
    if(search)   filter.$or=[{name:{$regex:search,$options:'i'}},{sku:{$regex:search,$options:'i'}}];
    const total=await Product.countDocuments(filter);
    const data=await Product.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(+limit).populate('supplier','name');
    res.json({success:true,total,page:+page,pages:Math.ceil(total/limit),data});
  } catch(e){ res.status(500).json({success:false,message:e.message}); }
};
exports.productGetOne = async (req,res) => {
  try { const p=await Product.findById(req.params.id).populate('supplier'); if(!p) return res.status(404).json({success:false,message:'Not found'}); res.json({success:true,data:p}); }
  catch(e){ res.status(500).json({success:false,message:e.message}); }
};
exports.productCreate = async (req,res) => {
  try {
    const n=await Product.countDocuments();
    req.body.sku=`PRD${String(n+1).padStart(5,'0')}`; req.body.createdBy=req.user._id;
    const p=await Product.create(req.body); res.status(201).json({success:true,data:p});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};
exports.productUpdate = async (req,res) => {
  try { const p=await Product.findByIdAndUpdate(req.params.id,req.body,{new:true}); res.json({success:true,data:p}); }
  catch(e){ res.status(400).json({success:false,message:e.message}); }
};
exports.productDelete = async (req,res) => {
  try { await Product.findByIdAndDelete(req.params.id); res.json({success:true,message:'Deleted'}); }
  catch(e){ res.status(500).json({success:false,message:e.message}); }
};

// ─── userController.js ────────────────────────────────────────────────────────
const User = require('../models/User');

exports.getUsers = async (req,res) => {
  try { const data=await User.find({isActive:true}).select('-password').sort({name:1}); res.json({success:true,data}); }
  catch(e){ res.status(500).json({success:false,message:e.message}); }
};
exports.updateProfile = async (req,res) => {
  try {
    const {name,phone,department} = req.body;
    const user=await User.findByIdAndUpdate(req.user._id,{name,phone,department},{new:true});
    res.json({success:true,data:user});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
};
