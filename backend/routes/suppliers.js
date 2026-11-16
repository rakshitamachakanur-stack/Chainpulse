const r=require('express').Router(),c=require('../controllers/controllers'),{protect,authorize}=require('../middleware/auth');
const { getSupplierScorecards } = require('../controllers/supplierScorecardController');

r.get('/scorecards', protect, getSupplierScorecards);
r.route('/').get(protect,c.supplierGetAll).post(protect,authorize('manager','procurement'),c.supplierCreate);
r.route('/:id').get(protect,c.supplierGetOne).put(protect,authorize('manager','procurement'),c.supplierUpdate).delete(protect,authorize('manager'),c.supplierDelete);
module.exports=r;
