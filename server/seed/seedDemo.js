require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');

const DEMO_EMAIL = new RegExp('@demo\\.edu$');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.random() * (max - min) + min;
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// Picks a status using weights
const weightedStatus = () => {
  const table = [
    ['applied', 30], ['shortlisted', 20], ['interview', 15],
    ['selected', 20], ['rejected', 15],
  ];
  let r = Math.random() * 100;
  for (const [status, weight] of table) {
    if ((r -= weight) < 0) return status;
  }
  return 'applied';
};

// Removes only demo data (accounts ending in @demo.edu)
const clearDemo = async () => {
  const users = await User.find({ email: DEMO_EMAIL }).select('_id');
  const userIds = users.map((u) => u._id);
  const companyIds = (await Company.find({ user: { $in: userIds } }).select('_id')).map((c) => c._id);
  const jobIds = (await Job.find({ company: { $in: companyIds } }).select('_id')).map((j) => j._id);

  await Application.deleteMany({ $or: [{ student: { $in: userIds } }, { job: { $in: jobIds } }] });
  await Job.deleteMany({ _id: { $in: jobIds } });
  await Company.deleteMany({ _id: { $in: companyIds } });
  await StudentProfile.deleteMany({ user: { $in: userIds } });
  await User.deleteMany({ _id: { $in: userIds } });
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await clearDemo();

  if (process.argv.includes('--clear')) {
    console.log('Demo data removed');
    return;
  }

  const password = await bcrypt.hash('demo1234', 10);

  // ---- Companies ----
  const companyNames = ['TechNova', 'InfoSys Labs', 'CloudWorks', 'DataBridge', 'FinServe'];
  const companyUsers = await User.insertMany(
    companyNames.map((name, i) => ({
      name, email: `company${i + 1}@demo.edu`, password, role: 'company',
    }))
  );
  const companies = await Company.insertMany(
    companyUsers.map((u, i) => ({
      user: u._id,
      companyName: companyNames[i],
      industry: 'IT Services',
      description: 'Demo company',
      status: 'approved',
    }))
  );

  // ---- Jobs (2 per company) ----
  const packages = [3.5, 4.5, 6, 8, 12, 18];
  const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const jobDocs = [];
  companies.forEach((c) => {
    for (let n = 1; n <= 2; n++) {
      jobDocs.push({
        company: c._id,
        title: n === 1 ? 'Software Engineer' : 'Associate Analyst',
        description: 'Demo job posting',
        location: 'Chennai',
        packageLPA: pick(packages),
        skillsRequired: ['JavaScript', 'SQL'],
        eligibility: { minCgpa: 6, maxBacklogs: 1, departments: [] },
        deadline,
      });
    }
  });
  const jobs = await Job.insertMany(jobDocs);

  // ---- Students ----
  const departments = ['CSE', 'CSE', 'CSE', 'IT', 'IT', 'ECE', 'ECE', 'EEE', 'MECH'];
  const allSkills = ['C', 'Java', 'Python', 'JavaScript', 'SQL', 'React'];
  const studentUsers = await User.insertMany(
    Array.from({ length: 40 }, (_, i) => ({
      name: `Student ${i + 1}`,
      email: `student${i + 1}@demo.edu`,
      password,
      role: 'student',
    }))
  );
  await StudentProfile.insertMany(
    studentUsers.map((u, i) => ({
      user: u._id,
      rollNumber: `DEMO${String(i + 1).padStart(3, '0')}`,
      department: pick(departments),
      batch: i % 4 === 0 ? 2026 : 2027,
      cgpa: Math.round(rand(6, 9.5) * 100) / 100,
      backlogs: Math.random() < 0.85 ? 0 : 1,
      skills: shuffle(allSkills).slice(0, 3),
    }))
  );

  // ---- Applications (1 to 3 distinct jobs per student) ----
  const applications = [];
  studentUsers.forEach((u) => {
    const count = 1 + Math.floor(Math.random() * 3);
    shuffle(jobs).slice(0, count).forEach((job) => {
      applications.push({ student: u._id, job: job._id, status: weightedStatus() });
    });
  });
  await Application.insertMany(applications);

  console.log(
    `Created ${companies.length} companies, ${jobs.length} jobs, ` +
    `${studentUsers.length} students, ${applications.length} applications`
  );
  console.log('Demo logins use the password: demo1234');
};

run()
  .catch((err) => console.error(err))
  .finally(() => mongoose.disconnect());