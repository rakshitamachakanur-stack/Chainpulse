const r=require('express').Router(),c=require('../controllers/controllers'),{protect,authorize}=require('../middleware/auth');
r.route('/').get(protect,c.deliveryGetAll).post(protect,authorize('logistics','manager'),c.deliveryCreate);
r.route('/:id').get(protect,c.deliveryGetOne).put(protect,authorize('logistics','manager'),c.deliveryUpdate);
module.exports=r;
