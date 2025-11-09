const router = require('express').Router();
const { User } = require('../models');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// List all users (admin only)
router.get('/', [auth, checkRole(['admin'])], async (req, res) => {
  const users = await User.findAll({ attributes: { exclude: ['password'] } });
  res.json(users);
});

// Promote user to club head (admin only)
router.put('/:userId/role', [auth, checkRole(['admin'])], async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  if (!['club_head', 'admin', 'member'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  const user = await User.findByPk(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.role = role;
  await user.save();
  res.json({ message: `User promoted to ${role}` });
});


// Assign user as club_head/president/secretary for a specific club (admin only)
const { Club, ClubMembership } = require('../models');
router.put('/:userId/club-role', [auth, checkRole(['admin'])], async (req, res) => {
  const { userId } = req.params;
  const { clubId, role } = req.body;
  if (!['club_head', 'president', 'secretary'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  const club = await Club.findByPk(clubId);
  if (!club) return res.status(404).json({ message: 'Club not found' });
  let membership = await ClubMembership.findOne({ where: { userId, clubId } });
  if (!membership) {
    membership = await ClubMembership.create({ userId, clubId, role, status: 'approved' });
  } else {
    membership.role = role;
    membership.status = 'approved';
    await membership.save();
  }
  res.json({ message: `User assigned as ${role} for club ${club.name}` });
});

module.exports = router;