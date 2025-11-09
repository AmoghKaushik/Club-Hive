const router = require('express').Router();
const { Event, Club, ClubMembership } = require('../models');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Get events for user's clubs only
router.get('/', auth, async (req, res) => {
  try {
    // If admin, show all events
    if (req.user.role === 'admin') {
      const events = await Event.findAll({ include: [Club] });
      return res.json(events);
    }
    
    // Get user's approved club memberships
    const memberships = await ClubMembership.findAll({
      where: { userId: req.user.id, status: 'approved' },
      attributes: ['clubId']
    });
    
    const clubIds = memberships.map(m => m.clubId);
    
    // Get events only for those clubs
    const events = await Event.findAll({ 
      where: { ClubId: clubIds },
      include: [Club] 
    });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create event (Admin or Board members of that club)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, venue, date, ClubId } = req.body;
    
    // Admin can create events for any club
    if (req.user.role !== 'admin') {
      // Check if user is a board member of this club
      const membership = await ClubMembership.findOne({
        where: {
          clubId: ClubId,
          userId: req.user.id,
          role: 'board',
          status: 'approved'
        }
      });
      
      if (!membership) {
        return res.status(403).json({ message: 'Forbidden: Only board members can create events for this club' });
      }
    }
    
    const event = await Event.create({
      title,
      description,
      venue,
      date,
      ClubId
    });
    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;