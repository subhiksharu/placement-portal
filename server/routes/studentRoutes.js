const express = require('express');
const {
  getProfile,
  saveProfile,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', protect, authorize('student'), getProfile);
router.put('/profile', protect, authorize('student'), saveProfile);

module.exports = router;