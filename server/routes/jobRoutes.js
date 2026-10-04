const express = require('express');

const {
  createJob,
  getMyJobs,
  getEligibleJobs,
  updateJob,
  deleteJob,
} = require('../controllers/jobController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, authorize('company'), createJob);

router.get('/my', protect, authorize('company'), getMyJobs);

router.get('/eligible', protect, authorize('student'), getEligibleJobs);

router.put('/:id', protect, authorize('company'), updateJob);

router.delete('/:id', protect, authorize('company'), deleteJob);

module.exports = router;