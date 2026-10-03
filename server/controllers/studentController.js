const StudentProfile = require('../models/StudentProfile');

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