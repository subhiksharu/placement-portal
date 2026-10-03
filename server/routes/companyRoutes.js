const express = require('express');
const {
  getProfile,
  saveProfile,
} = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', protect, authorize('company'), getProfile);
router.put('/profile', protect, authorize('company'), saveProfile);

module.exports = router;