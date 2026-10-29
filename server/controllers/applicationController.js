const mongoose = require('mongoose');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Company = require('../models/Company');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const { checkEligibility } = require('../utils/eligibility');
const notify = require('../utils/notify');

// Allowed status changes
const TRANSITIONS = {
  applied: ['shortlisted', 'rejected'],
  shortlisted: ['interview', 'rejected'],
  interview: ['selected', 'rejected'],
  selected: [],
  rejected: [],
};

// Notification messages for application status changes
const STATUS_MESSAGES = {
  shortlisted: (job, company) =>
    `${company} shortlisted you for "${job}"`,

  interview: (job, company) =>
    `${company} has called you for an interview for "${job}"`,

  selected: (job, company) =>
    `Congratulations! ${company} selected you for "${job}"`,

  rejected: (job, company) =>
    `${company} did not move forward with your application for "${job}"`,
};

// ---------- STUDENT: apply to a job ----------
exports.applyToJob = async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({
        message: 'Invalid job id',
      });
    }

    const profile = await StudentProfile.findOne({
      user: req.user.id,
    });

    if (!profile) {
      return res.status(400).json({
        message: 'Complete your profile first',
      });
    }

    // Resume is required before applying
    if (!profile.resumeUrl) {
      return res.status(400).json({
        message: 'Upload your resume before applying',
      });
    }

    const job = await Job.findById(jobId).populate(
      'company',
      'status user companyName'
    );

    if (
      !job ||
      !job.isActive ||
      !job.company ||
      job.company.status !== 'approved'
    ) {
      return res.status(404).json({
        message: 'Job not available',
      });
    }

    // Check whether the application deadline has passed
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    if (job.deadline < startOfToday) {
      return res.status(400).json({
        message: 'Application deadline has passed',
      });
    }

    // Check eligibility on the server
    const result = checkEligibility(profile, job);

    if (!result.eligible) {
      return res.status(403).json({
        message: 'You are not eligible for this job',
        reasons: result.reasons,
      });
    }

    // Create the application
    const application = await Application.create({
      student: req.user.id,
      job: job._id,
    });

    // Notify the company about the new applicant
    const applicant = await User.findById(req.user.id).select('name');

    await notify(
      job.company.user,
      `${applicant?.name || 'A student'} applied for "${job.title}"`
    );

    res.status(201).json(application);
  } catch (err) {
    // Handle duplicate applications
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'You have already applied to this job',
      });
    }

    res.status(500).json({
      message: err.message,
    });
  }
};

// ---------- STUDENT: my applications ----------
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({
      student: req.user.id,
    })
      .populate({
        path: 'job',
        select: 'title location packageLPA jobType deadline company',
        populate: {
          path: 'company',
          select: 'companyName',
        },
      })
      .sort('-createdAt');

    res.json(applications);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ---------- COMPANY: applicants for one of my jobs ----------
exports.getJobApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({
        message: 'Invalid job id',
      });
    }

    const company = await Company.findOne({
      user: req.user.id,
    });

    if (!company) {
      return res.status(404).json({
        message: 'Company profile not found',
      });
    }

    // Only allow access to this company's jobs
    const job = await Job.findOne({
      _id: jobId,
      company: company._id,
    });

    if (!job) {
      return res.status(404).json({
        message: 'Job not found',
      });
    }

    const applications = (
      await Application.find({
        job: job._id,
      })
        .populate('student', 'name email')
        .sort('-createdAt')
        .lean()
    ).filter((a) => a.student);

    // Hide the internal Cloudinary public ID
    const profiles = await StudentProfile.find({
      user: {
        $in: applications.map((a) => a.student._id),
      },
    })
      .select('-resumePublicId')
      .lean();

    const profileByUser = new Map(
      profiles.map((p) => [String(p.user), p])
    );

    const applicants = applications.map((a) => ({
      _id: a._id,
      status: a.status,
      appliedAt: a.createdAt,
      allowedNext: TRANSITIONS[a.status] || [],
      student: a.student,
      profile: profileByUser.get(String(a.student._id)) || null,
    }));

    res.json({
      job: {
        _id: job._id,
        title: job.title,
      },
      applicants,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ---------- COMPANY: change an applicant's status ----------
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid application id',
      });
    }

    const company = await Company.findOne({
      user: req.user.id,
    });

    if (!company) {
      return res.status(404).json({
        message: 'Company profile not found',
      });
    }

    const application = await Application.findById(
      req.params.id
    ).populate('job', 'company title');

    // Verify that the job belongs to this company
    if (
      !application ||
      !application.job ||
      String(application.job.company) !== String(company._id)
    ) {
      return res.status(404).json({
        message: 'Application not found',
      });
    }

    // Validate the status transition
    const allowed = TRANSITIONS[application.status];

    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({
        message: `Cannot move from "${application.status}" to "${status}"`,
      });
    }

    // Update the application status
    application.status = status;
    await application.save();

    // Notify the student about the status change
    if (STATUS_MESSAGES[status]) {
      await notify(
        application.student,
        STATUS_MESSAGES[status](
          application.job.title,
          company.companyName
        )
      );
    }

    res.json({
      _id: application._id,
      status: application.status,
      allowedNext: TRANSITIONS[application.status] || [],
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
