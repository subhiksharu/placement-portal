const express = require('express');

const {
  getCompanies,
  updateCompanyStatus,
  getAnalytics,
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('tpo'));

router.get('/analytics', getAnalytics);

router.get('/companies', getCompanies);

router.patch('/companies/:id/status', updateCompanyStatus);

module.exports = router;