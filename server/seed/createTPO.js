require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const exists = await User.findOne({ email: 'tpo@college.com' });

  if (exists) {
    console.log('TPO already exists');
  } else {
    await User.create({
      name: 'Placement Officer',
      email: 'tpo@college.com',
      password: await bcrypt.hash('tpo12345', 10),
      role: 'tpo',
    });

    console.log('TPO account created');
  }

  await mongoose.disconnect();
})();