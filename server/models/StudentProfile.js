const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    rollNumber: { type: String, trim: true },
    department: { type: String, required: true, trim: true },
    batch: { type: Number, required: true }, // graduation year, e.g. 2027
    cgpa: { type: Number, required: true, min: 0, max: 10 },
    backlogs: { type: Number, default: 0, min: 0 },
    phone: { type: String, trim: true },
    skills: [{ type: String, trim: true }],

    // Resume (file lives in Cloudinary, only references are stored here)
    resumeUrl: { type: String, default: '' },
    resumePublicId: { type: String, default: '' }, // needed to delete the file later
    resumeName: { type: String, default: '' }, // original file name, for display
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);