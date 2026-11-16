const r=require('express').Router(),c=require('../controllers/controllers'),{protect,authorize}=require('../middleware/auth');
r.route('/').get(protect,c.vehicleGetAll).post(protect,authorize('logistics','manager'),c.vehicleCreate);
r.route('/:id').get(protect,c.vehicleGetOne).put(protect,authorize('logistics','manager'),c.vehicleUpdate).delete(protect,authorize('manager'),c.vehicleDelete);
module.exports=r;
