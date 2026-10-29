require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');

    const tpoEmail = (process.env.TPO_EMAIL || 'tpo@college.com').trim().toLowerCase();
    const tpoPassword = process.env.TPO_PASSWORD || 'tpo12345';
    const tpoName = process.env.TPO_NAME || 'Placement Officer';

    const exists = await User.findOne({ email: tpoEmail });

    if (exists) {
      console.log(`TPO already exists: ${tpoEmail}`);
    } else {
      await User.create({
        name: tpoName,
        email: tpoEmail,
        password: await bcrypt.hash(tpoPassword, 10),
        role: 'tpo',
      });

      console.log(`TPO account created: ${tpoEmail}`);
    }
  } catch (err) {
    console.error('Error seeding TPO:', err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
