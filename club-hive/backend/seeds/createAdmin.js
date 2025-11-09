require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../models');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    // Use env vars if provided, otherwise defaults
    const email = process.env.ADMIN_EMAIL || 'admin@clubhive.local';
    const password = process.env.ADMIN_PASS || 'Admin@1234';
    const name = process.env.ADMIN_NAME || 'Site Admin';

    let existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log('Admin already exists:', email);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hashed,
      name,
      role: 'admin',
      points: 0
    });

    console.log('Created admin user:');
    console.log('  email:', email);
    console.log('  password:', password);
    console.log('  user id:', user.id);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin:', err);
    process.exit(1);
  }
}

createAdmin();
