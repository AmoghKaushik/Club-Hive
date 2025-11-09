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
    const { name, description, facultyAdvisor } = req.body;
    const club = await Club.create({
      name,
      description,
      facultyAdvisor
    });
    res.json(club);
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

// Approve/reject membership (Club head or Admin)
router.put('/:clubId/membership/:userId', [auth, checkRole(['admin', 'club_head'])], async (req, res) => {
  try {
    const { status } = req.body;
    const { clubId, userId } = req.params;

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

// Get user's clubs (my clubs)
router.get('/my-clubs', auth, async (req, res) => {
  try {
    const memberships = await ClubMembership.findAll({
      where: { userId: req.user.id },
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

module.exports = router;