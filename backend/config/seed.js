const mongoose = require('mongoose');
require('dotenv').config();
const User        = require('../models/User');
const Admin       = require('../models/Admin');
const Supplier    = require('../models/Supplier');
const Product     = require('../models/Product');
const Order       = require('../models/Order');
const Inventory   = require('../models/Inventory');
const Shipment    = require('../models/Shipment');
const Requisition = require('../models/Requisition');
const Vehicle     = require('../models/Vehicle');
const Delivery    = require('../models/Delivery');
const Notification= require('../models/Notification');
const GoodsReceipt= require('../models/GoodsReceipt');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chainpulse2');
  console.log('Connected to MongoDB');

  // Drop stale indexes
  const drops = [
    ['suppliers',['code_1']],['products',['sku_1']],
    ['orders',['orderNumber_1']],['shipments',['trackingNumber_1','shipmentId_1']],
    ['requisitions',['reqNumber_1']],['goodsreceipts',['grnNumber_1']],['deliveries',['deliveryNumber_1']],['vehicles',['regNumber_1']]
  ];
  for(const [col,idxs] of drops) for(const idx of idxs) { try{ await mongoose.connection.collection(col).dropIndex(idx); }catch(e){} }

  await Promise.all([User,Admin,Supplier,Product,Order,Inventory,Shipment,Requisition,Vehicle,Delivery,Notification,GoodsReceipt].map(m=>m.deleteMany({})));
  console.log('Cleared existing data');

  // Admins

  await Admin.create({name:'John Admin',email:'admin@chainpulse.com',password:'Admin@123',role:'admin'});
  console.log('✅ Admins seeded');

  // Users
  const manager    = await User.create({name:'Alice Manager',    email:'manager@chainpulse.com',    password:'User@123',role:'manager',    department:'Operations'});
  const warehouse  = await User.create({name:'Bob Warehouse',    email:'warehouse@chainpulse.com',  password:'User@123',role:'warehouse',  department:'Warehouse'});
  const logistics  = await User.create({name:'Carol Logistics',  email:'logistics@chainpulse.com',  password:'User@123',role:'logistics',  department:'Logistics'});
  const procurement= await User.create({name:'Dave Procurement', email:'procurement@chainpulse.com',password:'User@123',role:'procurement',department:'Procurement'});
  console.log('✅ Users seeded');

  // Suppliers
  const suppliers = await Supplier.insertMany([
    {code:'SUP0001',name:'TechParts Inc.',   contactName:'James Wilson',email:'james@techparts.com',  phone:'+1-555-0101',category:'electronics', status:'active',rating:4.5,leadTime:5, paymentTerms:'Net 30',address:{city:'San Jose',country:'USA'},  createdBy:manager._id},
    {code:'SUP0002',name:'RawMaterials Co.', contactName:'Sarah Chen',  email:'sarah@rawmat.com',     phone:'+1-555-0102',category:'raw_material',status:'active',rating:4.2,leadTime:10,paymentTerms:'Net 45',address:{city:'Chicago',country:'USA'},  createdBy:manager._id},
    {code:'SUP0003',name:'PackagingPro Ltd.',contactName:'Mike Torres', email:'mike@packpro.com',     phone:'+1-555-0103',category:'packaging',   status:'active',rating:3.8,leadTime:7, paymentTerms:'Net 30',address:{city:'Detroit',country:'USA'},  createdBy:procurement._id},
    {code:'SUP0004',name:'FastFreight LLC',  contactName:'Emma Davis',  email:'emma@fastfreight.com', phone:'+1-555-0104',category:'logistics',   status:'active',rating:4.7,leadTime:2, paymentTerms:'Net 15',address:{city:'Dallas',country:'USA'},   createdBy:manager._id},
    {code:'SUP0005',name:'GlobalSupply GmbH',contactName:'Klaus Müller',email:'klaus@globalsupply.de',phone:'+49-30-5555',category:'raw_material',status:'inactive',rating:3.5,leadTime:14,paymentTerms:'Net 60',address:{city:'Berlin',country:'Germany'},createdBy:procurement._id},
  ]);
  console.log('✅ Suppliers seeded');

  // Products
  const products = await Product.insertMany([
    {sku:'PRD00001',name:'Circuit Board A',   category:'Electronics', unit:'piece',unitPrice:45.99,supplier:suppliers[0]._id,createdBy:procurement._id},
    {sku:'PRD00002',name:'Steel Rod 10mm',    category:'Raw Material',unit:'kg',   unitPrice:2.50, supplier:suppliers[1]._id,createdBy:procurement._id},
    {sku:'PRD00003',name:'Cardboard Box L',   category:'Packaging',   unit:'piece',unitPrice:0.85, supplier:suppliers[2]._id,createdBy:procurement._id},
    {sku:'PRD00004',name:'Microcontroller X', category:'Electronics', unit:'piece',unitPrice:12.75,supplier:suppliers[0]._id,createdBy:procurement._id},
    {sku:'PRD00005',name:'Aluminum Sheet 2mm',category:'Raw Material',unit:'kg',   unitPrice:4.20, supplier:suppliers[1]._id,createdBy:procurement._id},
    {sku:'PRD00006',name:'Bubble Wrap Roll',  category:'Packaging',   unit:'meter',unitPrice:0.35, supplier:suppliers[2]._id,createdBy:procurement._id},
    {sku:'PRD00007',name:'Power Supply 12V',  category:'Electronics', unit:'piece',unitPrice:28.50,supplier:suppliers[0]._id,createdBy:procurement._id},
    {sku:'PRD00008',name:'Copper Wire 2mm',   category:'Raw Material',unit:'meter',unitPrice:1.10, supplier:suppliers[1]._id,createdBy:procurement._id},
  ]);
  console.log('✅ Products seeded');

  // Inventory
  await Inventory.insertMany(products.map((p,i)=>({
    product:p._id, warehouse:'Main Warehouse',
    quantity:   [120,8,450,25,15,800,60,200][i],
    reserved:   [20,2,50,5,5,100,10,30][i],
    reorderPoint:[30,20,100,20,25,200,15,50][i],
    reorderQty: [100,100,500,50,100,1000,50,200][i],
    maxStock:   [500,500,2000,200,300,5000,200,1000][i],
    location:{aisle:`A${i+1}`,shelf:'S1',bin:`B${i+1}`}
  })));
  console.log('✅ Inventory seeded');

  // Vehicles
  const vehicles = await Vehicle.insertMany([
    {regNumber:'TRK-001',type:'truck',make:'Volvo',model:'FH16',year:2021,capacity:20000,status:'available',driver:'John Smith',driverPhone:'+1-555-2001',fuelType:'diesel',createdBy:logistics._id},
    {regNumber:'VAN-001',type:'van',make:'Mercedes',model:'Sprinter',year:2022,capacity:3500,status:'in_use',driver:'Jane Doe',driverPhone:'+1-555-2002',fuelType:'diesel',createdBy:logistics._id},
    {regNumber:'TRK-002',type:'truck',make:'MAN',model:'TGX',year:2020,capacity:18000,status:'maintenance',driver:'Bob Lee',driverPhone:'+1-555-2003',fuelType:'diesel',createdBy:logistics._id},
  ]);
  console.log('✅ Vehicles seeded');

  // Requisitions
  const req1 = await Requisition.create({
    reqNumber:'REQ-202601-0001', title:'Q1 Electronics Restock',
    items:[{product:products[0]._id,quantity:50,unitPrice:45.99,totalPrice:2299.5},{product:products[3]._id,quantity:30,unitPrice:12.75,totalPrice:382.5}],
    totalAmount:2682, status:'approved', priority:'high',
    justification:'Stock critically low, production at risk',
    neededBy:new Date(Date.now()+7*86400000),
    supplier:suppliers[0]._id,
    approvedBy:manager._id, approvalNote:'Approved - critical need', approvedAt:new Date(Date.now()-2*86400000),
    createdBy:procurement._id,
    timeline:[{status:'draft',by:procurement._id,note:'Created'},{status:'pending',by:procurement._id,note:'Submitted'},{status:'approved',by:manager._id,note:'Approved - critical need'}]
  });
  const req2 = await Requisition.create({
    reqNumber:'REQ-202601-0002', title:'Packaging Materials Reorder',
    items:[{product:products[2]._id,quantity:200,unitPrice:0.85,totalPrice:170},{product:products[5]._id,quantity:500,unitPrice:0.35,totalPrice:175}],
    totalAmount:345, status:'pending', priority:'medium',
    justification:'Monthly packaging reorder',
    supplier:suppliers[2]._id,
    createdBy:procurement._id,
    timeline:[{status:'draft',by:procurement._id,note:'Created'},{status:'pending',by:procurement._id,note:'Submitted for approval'}]
  });
  const req3 = await Requisition.create({
    reqNumber:'REQ-202601-0003', title:'Raw Materials - Steel & Aluminum',
    items:[{product:products[1]._id,quantity:100,unitPrice:2.50,totalPrice:250},{product:products[4]._id,quantity:50,unitPrice:4.20,totalPrice:210}],
    totalAmount:460, status:'draft', priority:'low',
    createdBy:procurement._id,
    timeline:[{status:'draft',by:procurement._id,note:'Draft saved'}]
  });
  console.log('✅ Requisitions seeded');

  // Orders
  const statuses=['delivered','shipped','processing','approved','pending'];
  const orderDocs=[];
  for(let i=0;i<5;i++){
    const daysAgo=(5-i)*12;
    const created=new Date(Date.now()-daysAgo*86400000);
    const d=created;
    const num=`PO-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${String(i+1).padStart(4,'0')}`;
    const items=[{product:products[i%8]._id,quantity:10+(i*5),unitPrice:products[i%8].unitPrice,totalPrice:(10+i*5)*products[i%8].unitPrice}];
    const total=items[0].totalPrice;
    orderDocs.push({orderNumber:num,supplier:suppliers[i%5]._id,items,totalAmount:total,status:statuses[i],priority:['high','medium','low','critical','medium'][i],paymentStatus:['paid','partial','pending','pending','pending'][i],requisition:i===0?req1._id:undefined,expectedDelivery:new Date(created.getTime()+14*86400000),createdBy:procurement._id,createdAt:created,timeline:[{status:statuses[i],by:procurement._id,at:created}]});
  }
  const orders = await Order.insertMany(orderDocs,{timestamps:false});
  console.log('✅ Orders seeded');

  // Shipments
  const shipments = await Shipment.insertMany([
    {trackingNumber:'CP-FEDEX-001',order:orders[0]._id,vehicle:vehicles[0]._id,driver:'John Smith',carrier:'FedEx',serviceType:'express',status:'delivered',origin:{address:'123 Tech St',city:'San Jose',country:'USA',lat:37.33,lng:-121.89},destination:{address:'456 Warehouse Blvd',city:'Los Angeles',country:'USA',lat:34.05,lng:-118.24},currentLocation:{city:'Los Angeles',country:'USA',lat:34.05,lng:-118.24},estimatedDelivery:new Date(Date.now()-5*86400000),actualDelivery:new Date(Date.now()-5*86400000),weight:25,packages:3,cost:120,createdBy:logistics._id,events:[{status:'preparing',location:'San Jose',description:'Shipment created',timestamp:new Date(Date.now()-10*86400000)},{status:'picked_up',location:'San Jose',description:'Picked up',timestamp:new Date(Date.now()-9*86400000)},{status:'in_transit',location:'Fresno',description:'In transit',timestamp:new Date(Date.now()-7*86400000)},{status:'delivered',location:'Los Angeles',description:'Delivered',timestamp:new Date(Date.now()-5*86400000)}]},
    {trackingNumber:'CP-UPS-002',order:orders[1]._id,vehicle:vehicles[1]._id,driver:'Jane Doe',carrier:'UPS',serviceType:'standard',status:'in_transit',origin:{address:'789 Material Ave',city:'Chicago',country:'USA',lat:41.85,lng:-87.65},destination:{address:'456 Warehouse Blvd',city:'Los Angeles',country:'USA',lat:34.05,lng:-118.24},currentLocation:{city:'Las Vegas',country:'USA',lat:36.17,lng:-115.14},estimatedDelivery:new Date(Date.now()+2*86400000),weight:150,packages:10,cost:280,createdBy:logistics._id,events:[{status:'preparing',location:'Chicago',description:'Shipment prepared',timestamp:new Date(Date.now()-4*86400000)},{status:'picked_up',location:'Chicago',description:'Picked up',timestamp:new Date(Date.now()-3*86400000)},{status:'in_transit',location:'Las Vegas',description:'In transit',timestamp:new Date(Date.now()-86400000)}]},
    {trackingNumber:'CP-DHL-003',order:orders[2]._id,carrier:'DHL',serviceType:'freight',status:'out_for_delivery',origin:{address:'321 Fast St',city:'Dallas',country:'USA',lat:32.78,lng:-96.80},destination:{address:'456 Warehouse Blvd',city:'Los Angeles',country:'USA',lat:34.05,lng:-118.24},currentLocation:{city:'Los Angeles',country:'USA',lat:34.05,lng:-118.24},estimatedDelivery:new Date(Date.now()+86400000),weight:80,packages:6,cost:195,createdBy:logistics._id,events:[{status:'preparing',location:'Dallas',description:'Prepared',timestamp:new Date(Date.now()-3*86400000)},{status:'in_transit',location:'Phoenix',description:'In transit',timestamp:new Date(Date.now()-2*86400000)},{status:'out_for_delivery',location:'Los Angeles',description:'Out for delivery',timestamp:new Date(Date.now()-3600000)}]},
  ]);
  console.log('✅ Shipments seeded');

  // Deliveries
  await Delivery.insertMany([
    {deliveryNumber:'DEL-2026-0001',shipment:shipments[0]._id,order:orders[0]._id,vehicle:vehicles[0]._id,driver:'John Smith',status:'delivered',scheduledDate:new Date(Date.now()-6*86400000),deliveredAt:new Date(Date.now()-5*86400000),recipient:{name:'Main Warehouse',phone:'+1-555-3001',address:'456 Warehouse Blvd, Los Angeles'},proofOfDelivery:'Signed by Bob Warehouse',createdBy:logistics._id},
    {deliveryNumber:'DEL-2026-0002',shipment:shipments[1]._id,order:orders[1]._id,vehicle:vehicles[1]._id,driver:'Jane Doe',status:'in_transit',scheduledDate:new Date(Date.now()+2*86400000),recipient:{name:'Main Warehouse',phone:'+1-555-3001',address:'456 Warehouse Blvd, Los Angeles'},createdBy:logistics._id},
    {deliveryNumber:'DEL-2026-0003',shipment:shipments[2]._id,order:orders[2]._id,status:'dispatched',scheduledDate:new Date(Date.now()+86400000),recipient:{name:'Main Warehouse',phone:'+1-555-3001',address:'456 Warehouse Blvd, Los Angeles'},createdBy:logistics._id},
  ]);
  console.log('✅ Deliveries seeded');

  // GoodsReceipts
  await GoodsReceipt.insertMany([
    {grnNumber:'GRN-2026-0001',order:orders[0]._id,supplier:suppliers[0]._id,status:'verified',receivedDate:new Date(Date.now()-5*86400000),items:[{product:products[0]._id,orderedQty:50,receivedQty:50,rejectedQty:0,condition:'good'}],verifiedBy:warehouse._id,createdBy:warehouse._id},
    {grnNumber:'GRN-2026-0002',order:orders[1]._id,supplier:suppliers[1]._id,status:'draft',receivedDate:new Date(),items:[{product:products[1]._id,orderedQty:100,receivedQty:95,rejectedQty:5,rejectionReason:'Damaged packaging',condition:'damaged'}],createdBy:warehouse._id},
  ]);
  console.log('✅ Goods receipts seeded');

  // Notifications
  await Notification.insertMany([
    {title:'Low Stock Alert',message:'Steel Rod 10mm is critically low (qty: 8). Reorder recommended.',type:'low_stock',priority:'high',targetRole:'procurement',refModel:'Inventory',createdBy:warehouse._id},
    {title:'Requisition Approved',message:'REQ-202601-0001 "Q1 Electronics Restock" has been approved by Alice Manager.',type:'order_approved',priority:'medium',targetUser:procurement._id,refModel:'Requisition',refId:req1._id,createdBy:manager._id},
    {title:'Shipment In Transit',message:'CP-UPS-002 is now in transit. ETA: 2 days.',type:'shipment_update',priority:'low',targetRole:'warehouse',refModel:'Shipment',createdBy:logistics._id},
    {title:'Pending Approval',message:'2 requisitions are waiting for your approval.',type:'info',priority:'medium',targetRole:'manager',createdBy:procurement._id},
  ]);
  console.log('✅ Notifications seeded');

  console.log('\n🎉 Database seeded!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ADMIN  : admin@chainpulse.com / Admin@123');

  console.log('USERS  : manager@chainpulse.com / User@123');
  console.log('         warehouse@chainpulse.com / User@123');
  console.log('         logistics@chainpulse.com / User@123');
  console.log('         procurement@chainpulse.com / User@123');
  console.log('TRACKING: CP-FEDEX-001 | CP-UPS-002 | CP-DHL-003');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  await mongoose.disconnect();
};

seed().catch(e=>{ console.error('Seed error:',e.message); process.exit(1); });
