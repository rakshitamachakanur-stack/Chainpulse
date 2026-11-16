const r=require('express').Router(),c=require('../controllers/requisitionController'),{protect,authorize}=require('../middleware/auth');
r.route('/').get(protect,c.getAll).post(protect,authorize('procurement'),c.create);
r.route('/:id').get(protect,c.getOne).put(protect,authorize('procurement'),c.update).delete(protect,authorize('procurement'),c.remove);
r.put('/:id/submit',protect,authorize('procurement'),c.submit);
r.put('/:id/approve',protect,authorize('manager'),c.approve);
r.post('/:id/convert',protect,authorize('procurement','manager'),c.convertToPO);
module.exports=r;
