const Notification = require('../models/Notification');

const notify = async ({ title, message, type='info', priority='medium', targetRole, targetUser, refModel, refId, createdBy }) => {
  try {
    await Notification.create({ title, message, type, priority, targetRole, targetUser, refModel, refId, createdBy });
  } catch(e){ console.error('Notification error:', e.message); }
};

module.exports = notify;
