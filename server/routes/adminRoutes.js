const express = require('express');
const { getCompanies, updateCompanyStatus } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('tpo')); // applies to every route in this file

router.get('/companies', getCompanies);
router.patch('/companies/:id/status', updateCompanyStatus);

module.exports = router;