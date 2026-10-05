const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const StudentProfile = require('../models/StudentProfile');

// GET /api/admin/companies?status=pending
exports.getCompanies = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const companies = await Company.find(filter)
      .populate('user', 'name email')
      .sort('-createdAt');

    res.json(companies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/admin/companies/:id/status
exports.updateCompanyStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res
        .status(400)
        .json({ message: 'Status must be approved or rejected' });
    }

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json(company);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/analytics?batch=2027
exports.getAnalytics = async (req, res) => {
  try {
    const match = {};

    if (req.query.batch) {
      const batch = Number(req.query.batch);

      if (Number.isNaN(batch)) {
        return res.status(400).json({ message: 'Invalid batch' });
      }

      match.batch = batch;
    }

    const studentIds = await StudentProfile.find(match).distinct('user');

    const selectedWithJob = [
      {
        $match: {
          student: { $in: studentIds },
          status: 'selected',
        },
      },
      {
        $lookup: {
          from: Job.collection.name,
          localField: 'job',
          foreignField: '_id',
          as: 'job',
        },
      },
      { $unwind: '$job' },
    ];

    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const [
      departmentAgg,
      statusAgg,
      placedAgg,
      companyAgg,
      approvedCompanies,
      pendingCompanies,
      openJobs,
      batches,
    ] = await Promise.all([
      StudentProfile.aggregate([
        { $match: match },
        {
          $lookup: {
            from: Application.collection.name,
            let: { uid: '$user' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$student', '$$uid'] },
                      { $eq: ['$status', 'selected'] },
                    ],
                  },
                },
              },
              { $limit: 1 },
            ],
            as: 'offers',
          },
        },
        {
          $group: {
            _id: {
              $toUpper: {
                $trim: {
                  input: '$department',
                },
              },
            },
            total: { $sum: 1 },
            placed: {
              $sum: {
                $cond: [
                  { $gt: [{ $size: '$offers' }, 0] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { total: -1 } },
      ]),

      Application.aggregate([
        {
          $match: {
            student: { $in: studentIds },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      Application.aggregate([
        ...selectedWithJob,
        {
          $group: {
            _id: '$student',
            bestPackage: {
              $max: '$job.packageLPA',
            },
          },
        },
      ]),

      Application.aggregate([
        ...selectedWithJob,
        {
          $group: {
            _id: '$job.company',
            offers: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: Company.collection.name,
            localField: '_id',
            foreignField: '_id',
            as: 'company',
          },
        },
        { $unwind: '$company' },
        {
          $project: {
            _id: 0,
            company: '$company.companyName',
            offers: 1,
          },
        },
        { $sort: { offers: -1 } },
        { $limit: 10 },
      ]),

      Company.countDocuments({
        status: 'approved',
      }),

      Company.countDocuments({
        status: 'pending',
      }),

      Job.countDocuments({
        isActive: true,
        deadline: { $gte: startOfToday },
      }),

      StudentProfile.distinct('batch'),
    ]);

    const departments = departmentAgg.map((d) => ({
      department: d._id,
      total: d.total,
      placed: d.placed,
      percent: d.total
        ? Math.round((d.placed / d.total) * 100)
        : 0,
    }));

    const order = [
      'applied',
      'shortlisted',
      'interview',
      'selected',
      'rejected',
    ];

    const statusCounts = order.map((s) => ({
      status: s,
      count:
        statusAgg.find((x) => x._id === s)?.count || 0,
    }));

    const packages = placedAgg
      .map((p) => p.bestPackage)
      .filter(
        (n) =>
          typeof n === 'number' &&
          n > 0
      );

    const sum = packages.reduce(
      (a, b) => a + b,
      0
    );

    const bands = [
      {
        label: 'Below 4 LPA',
        min: 0,
        max: 4,
      },
      {
        label: '4 - 7 LPA',
        min: 4,
        max: 7,
      },
      {
        label: '7 - 10 LPA',
        min: 7,
        max: 10,
      },
      {
        label: '10+ LPA',
        min: 10,
        max: Infinity,
      },
    ];

    const packageBuckets = bands.map((b) => ({
      label: b.label,
      count: packages.filter(
        (p) =>
          p >= b.min &&
          p < b.max
      ).length,
    }));

    const totalStudents = studentIds.length;
    const placedStudents = placedAgg.length;

    res.json({
      batches: batches.sort((a, b) => a - b),

      summary: {
        totalStudents,
        placedStudents,

        placementPercent: totalStudents
          ? Math.round(
              (placedStudents / totalStudents) * 1000
            ) / 10
          : 0,

        totalApplications:
          statusCounts.reduce(
            (a, s) => a + s.count,
            0
          ),

        totalOffers:
          statusCounts.find(
            (s) => s.status === 'selected'
          ).count,

        avgPackage: packages.length
          ? Math.round(
              (sum / packages.length) * 100
            ) / 100
          : 0,

        highestPackage: packages.length
          ? Math.max(...packages)
          : 0,

        approvedCompanies,
        pendingCompanies,
        openJobs,
      },

      departments,
      statusCounts,
      packageBuckets,
      companyOffers: companyAgg,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};