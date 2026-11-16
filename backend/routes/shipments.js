const r=require('express').Router(),c=require('../controllers/controllers'),{protect,authorize}=require('../middleware/auth');
r.get('/track/:tn',c.shipmentTrack);
r.post('/simulate/tick',protect,c.shipmentSimulateTick);
r.route('/').get(protect,c.shipmentGetAll).post(protect,authorize('logistics','manager'),c.shipmentCreate);
r.put('/:id/location',protect,c.shipmentUpdateLocation);
r.route('/:id').get(protect,c.shipmentGetOne).put(protect,authorize('logistics','manager'),c.shipmentUpdate).delete(protect,authorize('manager'),c.shipmentDelete);
module.exports=r;
