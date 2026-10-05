const StudentProfile = require('../models/StudentProfile');
const crypto = require('crypto');
const cloudinary = require('../config/cloudinary');

exports.getProfile = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user.id });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveProfile = async (req, res) => {
  try {
    const {
      rollNumber,
      department,
      batch,
      cgpa,
      backlogs,
      phone,
      skills,
    } = req.body;

    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user.id },
      { rollNumber, department, batch, cgpa, backlogs, phone, skills },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json(profile);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Sends the file buffer to Cloudinary and resolves with the upload result
const uploadToCloudinary = (buffer, userId) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'placement-portal/resumes',
        public_id: `${userId}_${crypto.randomBytes(6).toString('hex')}.pdf`,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );

    stream.end(buffer);
  });

// POST /api/students/resume
exports.saveResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Choose a PDF file to upload',
      });
    }

    // Every real PDF starts with "%PDF"
    if (req.file.buffer.subarray(0, 4).toString() !== '%PDF') {
      return res.status(400).json({
        message: 'This file is not a valid PDF',
      });
    }

    const profile = await StudentProfile.findOne({
      user: req.user.id,
    });

    if (!profile) {
      return res.status(400).json({
        message: 'Save your profile before uploading a resume',
      });
    }

    const result = await uploadToCloudinary(
      req.file.buffer,
      req.user.id
    );

    const oldPublicId = profile.resumePublicId;

    profile.resumeUrl = result.secure_url;
    profile.resumePublicId = result.public_id;
    profile.resumeName = req.file.originalname.slice(0, 100);

    await profile.save();

    // Remove previous file only after new file is safely saved
    if (oldPublicId) {
      cloudinary.uploader
        .destroy(oldPublicId, { resource_type: 'raw' })
        .catch(() => {});
    }

    res.json({
      resumeUrl: profile.resumeUrl,
      resumeName: profile.resumeName,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Upload failed: ' + err.message,
    });
  }
};

// DELETE /api/students/resume
exports.removeResume = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({
      user: req.user.id,
    });

    if (!profile || !profile.resumeUrl) {
      return res.status(404).json({
        message: 'No resume to remove',
      });
    }

    const publicId = profile.resumePublicId;

    profile.resumeUrl = '';
    profile.resumePublicId = '';
    profile.resumeName = '';

    await profile.save();

    if (publicId) {
      cloudinary.uploader
        .destroy(publicId, { resource_type: 'raw' })
        .catch(() => {});
    }

    res.json({
      message: 'Resume removed',
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};