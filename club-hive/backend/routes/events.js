const router = require('express').Router();
const { Event, Club, ClubMembership, EventParticipation, User } = require('../models');
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

// Register for an event
router.post('/:eventId/register', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Check if event exists
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if already registered
    const existing = await EventParticipation.findOne({
      where: {
        EventId: eventId,
        UserId: req.user.id
      }
    });
    
    if (existing) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }
    
    // Create registration
    const participation = await EventParticipation.create({
      EventId: eventId,
      UserId: req.user.id,
      status: 'registered'
    });
    
    res.json({ message: 'Successfully registered for event', participation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unregister from an event
router.delete('/:eventId/register', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const participation = await EventParticipation.findOne({
      where: {
        EventId: eventId,
        UserId: req.user.id
      }
    });
    
    if (!participation) {
      return res.status(404).json({ message: 'Not registered for this event' });
    }
    
    // Only allow unregistering if attendance hasn't been marked
    if (participation.status !== 'registered') {
      return res.status(400).json({ message: 'Cannot unregister after attendance has been marked' });
    }
    
    await participation.destroy();
    res.json({ message: 'Successfully unregistered from event' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if current user is registered for an event
router.get('/:eventId/my-registration', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const participation = await EventParticipation.findOne({
      where: {
        EventId: eventId,
        UserId: req.user.id
      }
    });
    
    res.json({ 
      registered: !!participation,
      status: participation ? participation.status : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get event participants (for board members/admin)
router.get('/:eventId/participants', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check permission: admin or board member of the club
    if (req.user.role !== 'admin') {
      const membership = await ClubMembership.findOne({
        where: {
          clubId: event.ClubId,
          userId: req.user.id,
          role: 'board',
          status: 'approved'
        }
      });
      
      if (!membership) {
        return res.status(403).json({ message: 'Forbidden: Only board members can view participants' });
      }
    }
    
    // Get all participants
    const participants = await EventParticipation.findAll({
      where: { EventId: eventId },
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }]
    });
    
    res.json(participants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;