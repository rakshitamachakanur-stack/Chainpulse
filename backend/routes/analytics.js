const r=require('express').Router(),{dashboard}=require('../controllers/analyticsController'),{protect}=require('../middleware/auth');
const { askAssistant } = require('../controllers/aiAssistantController');

r.get('/dashboard',protect,dashboard);
r.post('/ai-assistant',protect,askAssistant);
module.exports=r;
