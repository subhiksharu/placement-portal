const express = require('express');
const {
  getProfile,
  saveProfile,
  saveResume,
  removeResume,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');
const { handleResumeUpload } = require('../middleware/upload');

const router = express.Router();

router.get('/profile', protect, authorize('student'), getProfile);
router.put('/profile', protect, authorize('student'), saveProfile);

// protect and authorize run BEFORE the file is accepted
router.post('/resume', protect, authorize('student'), handleResumeUpload, saveResume);
router.delete('/resume', protect, authorize('student'), removeResume);

module.exports = router;