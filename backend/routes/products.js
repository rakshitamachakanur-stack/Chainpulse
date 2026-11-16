const r=require('express').Router(),c=require('../controllers/controllers'),{protect,authorize}=require('../middleware/auth');
r.route('/').get(protect,c.productGetAll).post(protect,authorize('manager','procurement'),c.productCreate);
r.route('/:id').get(protect,c.productGetOne).put(protect,authorize('manager','procurement'),c.productUpdate).delete(protect,authorize('manager'),c.productDelete);
module.exports=r;
