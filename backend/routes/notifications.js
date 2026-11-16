const r=require('express').Router(),c=require('../controllers/controllers'),{protect}=require('../middleware/auth');
r.get('/',protect,c.getMyNotifications);r.put('/read-all',protect,c.markAllRead);r.put('/:id/read',protect,c.markRead);
module.exports=r;
