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
    batch: { type: Number, required: true },
    cgpa: { type: Number, required: true, min: 0, max: 10 },
    backlogs: { type: Number, default: 0, min: 0 },
    phone: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    resumeUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);