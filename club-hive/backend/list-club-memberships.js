// Script to print all club memberships for a given club, showing user, role, and status
require('dotenv').config();
const { sequelize, User, Club, ClubMembership } = require('./models');

async function listClubMemberships(clubName) {
  await sequelize.sync();
  const club = await Club.findOne({ where: { name: clubName } });
  if (!club) {
    console.log('Club not found');
    process.exit(1);
  }
  const memberships = await ClubMembership.findAll({
    where: { clubId: club.id },
    include: [{ model: User, attributes: ['id', 'name', 'email'] }]
  });
  if (memberships.length === 0) {
    console.log('No memberships for this club.');
    process.exit(0);
  }
  console.log(`Memberships for club: ${club.name}`);
  memberships.forEach(m => {
    console.log(`User: ${m.User?.name} (${m.User?.email}), Role: ${m.role}, Status: ${m.status}`);
  });
  process.exit(0);
}

// Usage: node list-club-memberships.js "Club Name"
const [,, clubName] = process.argv;
if (!clubName) {
  console.log('Usage: node list-club-memberships.js "Club Name"');
  process.exit(1);
}
listClubMemberships(clubName);
