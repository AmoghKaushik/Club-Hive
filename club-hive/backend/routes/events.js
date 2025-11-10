const router = require('express').Router();
const { Event, Club, ClubMembership, EventParticipation, User, Notification, Announcement } = require('../models');
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
    const { title, description, venue, date, ClubId, points } = req.body;
    
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
      points: points || 10,
      ClubId
    });

    // Auto-create announcement for the new event
    const club = await Club.findByPk(ClubId);
    const eventDate = new Date(date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

    const announcement = await Announcement.create({
      title: `New Event: ${title}`,
      content: `📅 ${title}\n\n${description}\n\n📍 Venue: ${venue}\n🕒 Date: ${formattedDate}\n🎯 Points: ${points || 10}`,
      clubId: ClubId,
      createdBy: req.user.id
    });

    // Create notifications for all club members
    const clubMembers = await ClubMembership.findAll({
      where: {
        clubId: ClubId,
        status: 'approved'
      },
      attributes: ['userId']
    });

    const notificationPromises = clubMembers.map(member => 
      Notification.create({
        userId: member.userId,
        type: 'announcement',
        title: `New Event: ${title}`,
        content: `${club.name} has posted a new event: ${title} on ${formattedDate}`,
        isRead: false,
        relatedId: announcement.id,
        relatedType: 'announcement'
      })
    );

    await Promise.all(notificationPromises);

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

// Mark attendance for event participants (Admin or Board members)
router.put('/:eventId/attendance', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, status } = req.body; // status: 'attended', 'absent', or 'registered'
    
    if (!['attended', 'absent', 'registered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "attended", "absent", or "registered"' });
    }
    
    // Get the event to check which club it belongs to
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is admin or board member of the club
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
        return res.status(403).json({ message: 'Forbidden: Only board members can mark attendance' });
      }
    }
    
    // Find the participation record
    const participation = await EventParticipation.findOne({
      where: { EventId: eventId, UserId: userId }
    });
    
    if (!participation) {
      return res.status(404).json({ message: 'Participant not found' });
    }
    
    const previousStatus = participation.status;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Handle points based on status changes
    const eventPoints = event.points || 10;
    
    // If changing from attended to absent or registered, remove points
    if (previousStatus === 'attended' && status !== 'attended') {
      user.points = Math.max(0, (user.points || 0) - eventPoints);
      await user.save();
    }
    
    // If changing to attended from any other status, add points
    if (status === 'attended' && previousStatus !== 'attended') {
      user.points = (user.points || 0) + eventPoints;
      await user.save();
      
      // Create notification for points awarded
      await Notification.create({
        userId: userId,
        type: 'points_awarded',
        title: 'Points Earned!',
        content: `You earned ${eventPoints} points for attending "${event.title}"!`,
        isRead: false,
        relatedId: eventId,
        relatedType: 'event'
      });
    }
    
    // Update the status
    participation.status = status;
    await participation.save();
    
    res.json({ message: 'Attendance marked successfully', participation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;