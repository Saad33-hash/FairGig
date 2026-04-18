require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Shift = require('../models/Shift');
const User  = require('../models/User');

const CITIES     = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'];
const CATEGORIES = ['ride-hailing', 'food-delivery', 'freelance', 'domestic'];
const PLATFORMS  = {
  'ride-hailing':  ['Careem', 'Bykea'],
  'food-delivery': ['Foodpanda', 'Bykea'],
  'freelance':     ['Upwork', 'Other'],
  'domestic':      ['Other'],
};

const rand    = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick    = (arr) => arr[Math.floor(Math.random() * arr.length)];

function randomDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Seed hardcoded admin user
  const bcrypt = require('bcryptjs');
  const adminEmail = 'admin@faircig.com';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      firstName: 'Admin',
      lastName: 'FairGig',
      email: adminEmail,
      password: await bcrypt.hash('Admin123!', 10),
      provider: 'local',
      isVerified: true,
      role: 'admin',
      status: 'approved',
    });
    console.log('Created admin: admin@faircig.com / Admin123!');
  } else {
    console.log('Admin already exists, skipping.');
  }

  // Find or create seed worker accounts per city/category combo
  const workers = [];
  for (const city of CITIES) {
    for (const category of CATEGORIES) {
      const email = `seed.${city.toLowerCase()}.${category}@fairigg.dev`;
      let worker  = await User.findOne({ email });
      if (!worker) {
        worker = await User.create({
          firstName: `${city}`,
          lastName:  category.replace('-', ' '),
          email,
          password:  'seeded-no-login',
          provider:  'local',
          isVerified: true,
          role:       'worker',
          city,
          category,
        });
        console.log(`Created worker: ${email}`);
      }
      workers.push(worker);
    }
  }

  // Delete existing seeded shifts
  const workerIds = workers.map((w) => w._id);
  const deleted   = await Shift.deleteMany({ workerId: { $in: workerIds } });
  console.log(`Cleared ${deleted.deletedCount} old seed shifts`);

  const shifts = [];

  for (const worker of workers) {
    const platforms = PLATFORMS[worker.category];
    // 15–20 shifts per worker over last 6 months → ~256 total shifts
    const count = randInt(15, 20);

    for (let i = 0; i < count; i++) {
      const platform         = pick(platforms);
      const daysAgo          = randInt(0, 180);
      const hoursWorked      = Math.round(rand(3, 12) * 2) / 2; // 0.5-step
      const grossEarned      = Math.round(rand(800, 5000));

      // Deduction rate: mostly 20–30%, occasional spike to 40%+ (anomaly)
      const deductionRate    = Math.random() < 0.1 ? rand(0.38, 0.48) : rand(0.18, 0.32);
      const platformDeductions = Math.round(grossEarned * deductionRate);
      const netReceived      = grossEarned - platformDeductions;

      shifts.push({
        workerId:            worker._id,
        platform,
        date:                randomDate(daysAgo),
        hoursWorked,
        grossEarned,
        platformDeductions,
        netReceived,
        city:                worker.city,
        category:            worker.category,
        verificationStatus:  pick(['verified', 'verified', 'verified', 'unsubmitted']),
        anomalyFlag:         deductionRate > 0.37,
      });
    }
  }

  await Shift.insertMany(shifts);
  console.log(`Seeded ${shifts.length} shifts across ${workers.length} workers`);
  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => { console.error(err); process.exit(1); });
