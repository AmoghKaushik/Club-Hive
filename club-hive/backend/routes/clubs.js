const router = require('express').Router();
const { Club, User, ClubMembership } = require('../models');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Get pending join requests for a club (admin/board members)
router.get('/:clubId/pending', auth, async (req, res) => {
  try {
    const { clubId } = req.params;
    // Allow if admin
    if (req.user.role === 'admin') {
      const pending = await ClubMembership.findAll({
        where: { clubId, status: 'pending' },
        include: [{ model: User, attributes: ['id', 'name', 'email'] }]
      });
      return res.json(pending);
    }
    // Check if user is board member for this club
    const membership = await ClubMembership.findOne({
      where: {
        clubId,
        userId: req.user.id,
        role: 'board',
        status: 'approved'
      }
    });
    if (!membership) {
      return res.status(403).json({ message: 'Forbidden: not a board member for this club' });
    }
    const pending = await ClubMembership.findAll({
      where: { clubId, status: 'pending' },
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });
    res.json(pending);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all clubs
router.get('/', auth, async (req, res) => {
  try {
    const clubs = await Club.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
          through: { attributes: ['role', 'status'] },
        }
      ]
    });
    res.json(clubs);
  } catch (error) {
    console.error('Error in GET /api/clubs:', error);
    if (error.errors) {
      error.errors.forEach(e => console.error(e.message));
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create club (Admin only)
router.post('/', [auth, checkRole(['admin'])], async (req, res) => {
  try {
    const { name, description, facultyAdvisor, category } = req.body;
    const club = await Club.create({
      name,
      description,
      facultyAdvisor,
      category
    });
    res.json(club);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update club (Admin only)
router.put('/:clubId', [auth, checkRole(['admin'])], async (req, res) => {
  try {
    const { clubId } = req.params;
    const { name, description, category } = req.body;
    
    const club = await Club.findByPk(clubId);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    if (name) club.name = name;
    if (description !== undefined) club.description = description;
    if (category !== undefined) club.category = category;
    await club.save();
    
    res.json({ message: 'Club updated successfully', club });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete club (Admin only)
router.delete('/:clubId', [auth, checkRole(['admin'])], async (req, res) => {
  try {
    const { clubId } = req.params;
    
    const club = await Club.findByPk(clubId);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    await club.destroy();
    res.json({ message: 'Club deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join club request
router.post('/:clubId/join', auth, async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;

    const membership = await ClubMembership.create({
      userId,
      clubId,
      status: 'pending'
    });

    res.json(membership);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/reject membership (Board members or Admin)
router.put('/:clubId/membership/:userId', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const { clubId, userId } = req.params;

    // Admin can approve/reject any membership
    if (req.user.role !== 'admin') {
      // Check if user is a board member of this club
      const boardMembership = await ClubMembership.findOne({
        where: {
          clubId,
          userId: req.user.id,
          role: 'board',
          status: 'approved'
        }
      });
      
      if (!boardMembership) {
        return res.status(403).json({ message: 'Forbidden: Only board members can manage memberships for this club' });
      }
    }

    const membership = await ClubMembership.findOne({
      where: { clubId, userId }
    });

    if (!membership) {
      return res.status(404).json({ message: 'Membership request not found' });
    }

    membership.status = status;
    await membership.save();

    res.json(membership);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's clubs (my clubs) - exclude rejected
router.get('/my-clubs', auth, async (req, res) => {
  try {
    const memberships = await ClubMembership.findAll({
      where: { 
        userId: req.user.id,
        status: ['pending', 'approved'] // Exclude rejected
      },
      include: [
        {
          model: Club,
          attributes: ['id', 'name', 'description', 'status']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(memberships);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get club members with their roles (admin or board members of that club)
router.get('/:clubId/members', auth, async (req, res) => {
  try {
    const { clubId } = req.params;
    
    // Check permission: admin or board member of this club
    if (req.user.role !== 'admin') {
      const membership = await ClubMembership.findOne({
        where: {
          clubId,
          userId: req.user.id,
          role: 'board',
          status: 'approved'
        }
      });
      if (!membership) {
        return res.status(403).json({ message: 'Forbidden: not authorized to view members' });
      }
    }
    
    const members = await ClubMembership.findAll({
      where: { clubId, status: 'approved' },
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });
    res.json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update member role in club (admin only)
router.put('/:clubId/members/:userId/role', auth, async (req, res) => {
  try {
    const { clubId, userId } = req.params;
    const { role, roleName } = req.body;
    
    // Only admin can update roles
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can assign roles' });
    }
    
    // Validate role combinations
    const boardRoles = ['President', 'Vice President', 'General Secretary', 'Treasurer', 'HR Head', 'PR Head'];
    const memberRoles = ['Member', 'Managing Committee', 'Working Committee', 'Volunteer', 'Other'];
    
    if (role === 'board' && memberRoles.includes(roleName) && !['Managing Committee', 'Working Committee', 'Other'].includes(roleName)) {
      return res.status(400).json({ message: 'Board type cannot have Member or Volunteer role name' });
    }
    
    if (role === 'member' && boardRoles.includes(roleName)) {
      return res.status(400).json({ message: 'Member type cannot have leadership role names' });
    }
    
    const membership = await ClubMembership.findOne({
      where: { clubId, userId, status: 'approved' }
    });
    
    if (!membership) {
      return res.status(404).json({ message: 'Member not found in this club' });
    }
    
    membership.role = role;
    membership.roleName = roleName;
    await membership.save();
    
    res.json({ message: 'Role updated successfully', membership });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove member from club (admin or board members of that club)
router.delete('/:clubId/members/:userId', auth, async (req, res) => {
  try {
    const { clubId, userId } = req.params;
    
    // Check permission: admin or board member of this club
    if (req.user.role !== 'admin') {
      const membership = await ClubMembership.findOne({
        where: {
          clubId,
          userId: req.user.id,
          role: 'board',
          status: 'approved'
        }
      });
      if (!membership) {
        return res.status(403).json({ message: 'Forbidden: not authorized to remove members' });
      }
    }
    
    const memberToRemove = await ClubMembership.findOne({
      where: { clubId, userId }
    });
    
    if (!memberToRemove) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    await memberToRemove.destroy();
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;