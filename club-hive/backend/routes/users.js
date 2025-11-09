const router = require('express').Router();
const { User, Club, ClubMembership } = require('../models');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// List all users (admin only)
router.get('/', [auth, checkRole(['admin'])], async (req, res) => {
  const users = await User.findAll({ attributes: { exclude: ['password'] } });
  res.json(users);
});

// Get all club memberships for a user (user can view their own, admin can view anyone's)
router.get('/:userId/memberships', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Users can only view their own memberships unless they're admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You can only view your own memberships' });
    }
    
    const memberships = await ClubMembership.findAll({
      where: { userId },
      include: [{ model: Club, attributes: ['id', 'name', 'description', 'status'] }]
    });
    res.json(memberships);
  } catch (error) {
    console.error('Error fetching memberships:', error);
    res.status(500).json({ message: 'Server error' });
  }
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


// Assign user as board member for a specific club (admin only)
router.put('/:userId/club-role', [auth, checkRole(['admin'])], async (req, res) => {
  try {
    const { userId } = req.params;
    const { clubId, role } = req.body;
    
    if (!['member', 'board'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be "member" or "board"' });
    }
    
    const club = await Club.findByPk(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    let membership = await ClubMembership.findOne({ where: { userId, clubId } });
    
    if (!membership) {
      // Create new membership if doesn't exist
      membership = await ClubMembership.create({ 
        userId, 
        clubId, 
        role, 
        status: 'approved' 
      });
    } else {
      // Update existing membership
      membership.role = role;
      membership.status = 'approved';
      await membership.save();
    }
    
    res.json({ 
      message: `${user.name} assigned as ${role} for ${club.name}`,
      membership 
    });
  } catch (error) {
    console.error('Error assigning club role:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;