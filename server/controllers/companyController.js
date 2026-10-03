const Company = require('../models/Company');

exports.getProfile = async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user.id });
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveProfile = async (req, res) => {
  try {
    const { companyName, website, industry, description } = req.body;

    const company = await Company.findOneAndUpdate(
      { user: req.user.id },
      { companyName, website, industry, description },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json(company);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};