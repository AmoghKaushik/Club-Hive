// Usage: node create-admin.js <email> <password> <name>
const bcrypt = require('bcryptjs');
const { User } = require('./backend/models');

async function createAdmin(email, password, name) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const user = await User.create({
    email,
    password: hash,
    name,
    role: 'admin',
    points: 0
  });
  console.log('Admin created:', user.email);
}

const [,, email, password, name] = process.argv;
if (!email || !password || !name) {
  console.log('Usage: node create-admin.js <email> <password> <name>');
  process.exit(1);
}

createAdmin(email, password, name).then(() => process.exit(0));
