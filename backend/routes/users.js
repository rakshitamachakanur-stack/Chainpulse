const r=require('express').Router(),{getUsers,updateProfile}=require('../controllers/controllers'),{protect}=require('../middleware/auth');
r.get('/',protect,getUsers);r.put('/profile',protect,updateProfile);module.exports=r;
