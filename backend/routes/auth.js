const r=require('express').Router(),c=require('../controllers/authController'),{protect,adminProtect}=require('../middleware/auth');
r.post('/register',c.register);r.post('/login',c.login);r.get('/me',protect,c.getMe);r.put('/password',protect,c.updatePassword);r.post('/admin/login',c.adminLogin);r.get('/admin/me',adminProtect,c.getAdminMe);
module.exports=r;
