// Script to promote a user to club_head/president/secretary for a specific club in ClubMembership
require('dotenv').config();
const { sequelize, User, Club, ClubMembership } = require('./models');

async function promoteUserToClubRole({ userEmail, clubName, role = 'club_head' }) {
  if (!['club_head', 'president', 'secretary'].includes(role)) {
    throw new Error('Invalid role');
  }
  await sequelize.sync();
  const user = await User.findOne({ where: { email: userEmail } });
  if (!user) throw new Error('User not found');
  const club = await Club.findOne({ where: { name: clubName } });
  if (!club) throw new Error('Club not found');
  let membership = await ClubMembership.findOne({ where: { userId: user.id, clubId: club.id } });
  if (!membership) {
    membership = await ClubMembership.create({ userId: user.id, clubId: club.id, role, status: 'approved' });
  } else {
    membership.role = role;
    membership.status = 'approved';
    await membership.save();
  }
  console.log(`User ${user.email} is now ${role} of club ${club.name}`);
  process.exit(0);
}

// Usage: node promote-club-role.js user@example.com "Club Name" club_head
const [,, userEmail, clubName, role] = process.argv;
if (!userEmail || !clubName) {
  console.log('Usage: node promote-club-role.js user@example.com "Club Name" [club_head|president|secretary]');
  process.exit(1);
}
promoteUserToClubRole({ userEmail, clubName, role: role || 'club_head' });
