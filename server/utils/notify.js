const Notification = require('../models/Notification');

const notify = async (userId, message) => {
  try {
    await Notification.create({
      user: userId,
      message: message,
    });
  } catch (err) {
    console.error('Notification failed:', err.message);
  }
};

module.exports = notify;
