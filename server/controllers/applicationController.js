const mongoose = require('mongoose');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Company = require('../models/Company');
const StudentProfile = require('../models/StudentProfile');
const { checkEligibility } = require('../utils/eligibility');

// Allowed status changes. Anything not listed here is rejected.
const TRANSITIONS = {
  applied: ['shortlisted', 'rejected'],
  shortlisted: ['interview', 'rejected'],
  interview: ['selected', 'rejected'],
  selected: [],
  rejected: [],
};

// ---------- STUDENT: apply to a job ----------
exports.applyToJob = async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: 'Invalid job id' });
    }

    const profile = await StudentProfile.findOne({ user: req.user.id });

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

    const job = await Job.findById(jobId).populate('company', 'status');

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

    // Same "start of today" rule as the eligible-jobs list
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    if (job.deadline < startOfToday) {
      return res.status(400).json({
        message: 'Application deadline has passed',
      });
    }

    // Re-check eligibility on the server. Never trust the frontend.
    const result = checkEligibility(profile, job);

    if (!result.eligible) {
      return res.status(403).json({
        message: 'You are not eligible for this job',
        reasons: result.reasons,
      });
    }

    const application = await Application.create({
      student: req.user.id,
      job: job._id,
    });

    res.status(201).json(application);
  } catch (err) {
    // 11000 = duplicate key error from the unique index
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

    // Matching on company too means you can only see applicants of YOUR jobs
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

    // Hide internal Cloudinary public ID from companies
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
      allowedNext: TRANSITIONS[a.status],
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
    ).populate('job', 'company');

    // Ownership check: the application's job must belong to this company
    if (
      !application ||
      !application.job ||
      String(application.job.company) !== String(company._id)
    ) {
      return res.status(404).json({
        message: 'Application not found',
      });
    }

    const allowed = TRANSITIONS[application.status];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Cannot move from "${application.status}" to "${status}"`,
      });
    }

    application.status = status;
    await application.save();

    res.json({
      _id: application._id,
      status: application.status,
      allowedNext: TRANSITIONS[application.status],
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};