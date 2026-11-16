const r=require('express').Router(),c=require('../controllers/inventoryController'),{protect,authorize}=require('../middleware/auth');
const { getDemandForecast, autoDraftRequisition } = require('../controllers/forecastController');

r.get('/forecasting', protect, getDemandForecast);
r.post('/forecasting/auto-draft', protect, authorize('manager','procurement','warehouse'), autoDraftRequisition);
r.get('/low-stock',protect,c.getLowStock);
r.route('/').get(protect,c.getAll).post(protect,authorize('manager','warehouse'),c.create);
r.route('/:id').get(protect,c.getOne).put(protect,authorize('manager','warehouse'),c.update);
r.put('/:id/adjust',protect,authorize('manager','warehouse'),c.adjust);
module.exports=r;
