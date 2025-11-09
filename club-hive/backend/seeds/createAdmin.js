require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../models');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    
    // Admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@local.com';
    const adminPassword = process.env.ADMIN_PASS || 'admin';
    const adminName = process.env.ADMIN_NAME || 'Site Admin';

    let existing = await User.findOne({ where: { email: adminEmail } });
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(adminPassword, salt);
      const admin = await User.create({
        email: adminEmail,
        password: hashed,
        name: adminName,
        role: 'admin',
        points: 0
      });
      console.log('Created admin user:');
      console.log('  email:', adminEmail);
      console.log('  password:', adminPassword);
      console.log('  user id:', admin.id);
    } else {
      console.log('Admin already exists:', adminEmail);
    }

    // Test user 1: Chad
    const chadEmail = 'chad@local.com';
    const chadPassword = 'password';
    existing = await User.findOne({ where: { email: chadEmail } });
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(chadPassword, salt);
      const chad = await User.create({
        email: chadEmail,
        password: hashed,
        name: 'Chad',
        role: 'member',
        points: 0
      });
      console.log('Created test user:');
      console.log('  email:', chadEmail);
      console.log('  password:', chadPassword);
      console.log('  user id:', chad.id);
    } else {
      console.log('Test user already exists:', chadEmail);
    }

    // Test user 2: Amogh
    const amoghEmail = 'amogh@local.com';
    const amoghPassword = 'password';
    existing = await User.findOne({ where: { email: amoghEmail } });
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(amoghPassword, salt);
      const amogh = await User.create({
        email: amoghEmail,
        password: hashed,
        name: 'Amogh',
        role: 'member',
        points: 0
      });
      console.log('Created test user:');
      console.log('  email:', amoghEmail);
      console.log('  password:', amoghPassword);
      console.log('  user id:', amogh.id);
    } else {
      console.log('Test user already exists:', amoghEmail);
    }

    console.log('\nAll users created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to create users:', err);
    process.exit(1);
  }
}

createAdmin();
