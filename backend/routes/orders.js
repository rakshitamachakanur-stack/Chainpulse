const r=require('express').Router(),c=require('../controllers/orderController'),{protect,authorize}=require('../middleware/auth');
r.route('/').get(protect,c.getAll).post(protect,c.create);
r.route('/:id').get(protect,c.getOne).put(protect,c.update).delete(protect,authorize('manager'),c.remove);
r.put('/:id/status',protect,authorize('manager','logistics'),c.updateStatus);
module.exports=r;
