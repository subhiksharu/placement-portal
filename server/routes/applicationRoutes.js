const express = require('express');
const {
  applyToJob,
  getMyApplications,
  getJobApplicants,
  updateStatus,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, authorize('student'), applyToJob);
router.get('/my', protect, authorize('student'), getMyApplications);
router.get('/job/:jobId', protect, authorize('company'), getJobApplicants);
router.patch('/:id/status', protect, authorize('company'), updateStatus);

module.exports = router;