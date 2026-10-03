const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    jobType: {
      type: String,
      enum: ['full-time', 'internship'],
      default: 'full-time',
    },
    packageLPA: { type: Number, min: 0 }, // salary in lakhs per annum
    skillsRequired: [{ type: String, trim: true }],

    // Used for filtering in Phase 4
    eligibility: {
      minCgpa: { type: Number, default: 0, min: 0, max: 10 },
      maxBacklogs: { type: Number, default: 0, min: 0 },
      departments: [{ type: String, trim: true }], // empty array = all departments
      batch: { type: Number }, // e.g. 2027; empty = any batch
    },

    deadline: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);