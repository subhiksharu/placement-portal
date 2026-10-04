const Company = require('../models/Company');
const Job = require('../models/Job');
const StudentProfile = require('../models/StudentProfile');
const { checkEligibility, skillMatch } = require('../utils/eligibility');

// Returns the company only if it exists AND is approved
const getApprovedCompany = async (userId) => {
  const company = await Company.findOne({ user: userId });
  return company && company.status === 'approved' ? company : null;
};

// Whitelist the fields a company is allowed to set
const pickJobFields = (body) => ({
  title: body.title,
  description: body.description,
  location: body.location,
  jobType: body.jobType,
  packageLPA: body.packageLPA,
  skillsRequired: body.skillsRequired,
  eligibility: body.eligibility,
  deadline: body.deadline,
  isActive: body.isActive,
});

exports.createJob = async (req, res) => {
  try {
    const company = await getApprovedCompany(req.user.id);

    if (!company) {
      return res
        .status(403)
        .json({ message: 'Your company profile must be approved by the TPO first' });
    }

    const job = await Job.create({
      ...pickJobFields(req.body),
      company: company._id,
    });

    res.status(201).json(job);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getMyJobs = async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user.id });

    if (!company) return res.json([]);

    const jobs = await Job.find({ company: company._id }).sort('-createdAt');

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const company = await getApprovedCompany(req.user.id);

    if (!company) {
      return res.status(403).json({ message: 'Company not approved' });
    }

    // Matching on company too means you can only edit YOUR OWN jobs
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, company: company._id },
      pickJobFields(req.body),
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const company = await getApprovedCompany(req.user.id);

    if (!company) {
      return res.status(403).json({ message: 'Company not approved' });
    }

    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      company: company._id,
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get jobs the student is eligible and ineligible for
exports.getEligibleJobs = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(400).json({ message: 'Complete your profile first' });
    }

    // Only jobs from approved companies are visible to students
    const approvedIds = await Company.find({
      status: 'approved',
    }).distinct('_id');

    // Keep the job open for the whole deadline day
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const jobs = await Job.find({
      isActive: true,
      deadline: { $gte: startOfToday },
      company: { $in: approvedIds },
    })
      .populate('company', 'companyName industry website')
      .sort('deadline')
      .lean();

    const eligible = [];
    const ineligible = [];

    for (const job of jobs) {
      const result = checkEligibility(profile, job);

      if (result.eligible) {
        eligible.push({
          ...job,
          skillMatch: skillMatch(
            profile.skills,
            job.skillsRequired
          ),
        });
      } else {
        ineligible.push({
          ...job,
          reasons: result.reasons,
        });
      }
    }

    // Best skill match first
    eligible.sort(
      (a, b) => b.skillMatch.percent - a.skillMatch.percent
    );

    res.json({
      eligible,
      ineligible,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};