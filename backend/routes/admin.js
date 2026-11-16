const r=require('express').Router(),c=require('../controllers/adminController'),{adminProtect}=require('../middleware/auth');
r.use(adminProtect);r.get('/stats',c.getStats);r.get('/activity',c.getActivity);r.get('/orders',c.getAllOrders);
r.route('/users').get(c.getUsers).post(c.createUser);
r.route('/users/:id').put(c.updateUser).delete(c.deleteUser);
r.put('/users/:id/toggle',c.toggleUser);
r.route('/admins').get(c.getAdmins).post(c.createAdmin);
module.exports=r;
