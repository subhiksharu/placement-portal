const Company = require('../models/Company');

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

// PATCH /api/admin/companies/:id/status   body: { "status": "approved" }
exports.updateCompanyStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};