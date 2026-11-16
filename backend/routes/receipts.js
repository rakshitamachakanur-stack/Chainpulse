const r=require('express').Router(),c=require('../controllers/receiptController'),{protect,authorize}=require('../middleware/auth');
r.route('/').get(protect,c.getAll).post(protect,authorize('warehouse','manager'),c.create);
r.route('/:id').get(protect,c.getOne);r.put('/:id/verify',protect,authorize('warehouse','manager'),c.verify);
module.exports=r;
