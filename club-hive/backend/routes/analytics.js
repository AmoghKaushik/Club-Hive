const router = require('express').Router();
const { User, Club, ClubMembership, Event, EventParticipation } = require('../models');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { Op } = require('sequelize');

// Get system-wide statistics (Admin only)
router.get('/system-wide', [auth, checkRole(['admin'])], async (req, res) => {
  try {
    // Total counts
    const totalUsers = await User.count({ where: { role: { [Op.ne]: 'admin' } } });
    const totalClubs = await Club.count();
    const totalEvents = await Event.count();
    const totalActiveMembers = await ClubMembership.count({ 
      where: { status: 'approved' },
      distinct: true,
      col: 'userId'
    });

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEvents = await Event.count({
      where: {
        createdAt: { [Op.gte]: thirtyDaysAgo }
      }
    });

    const recentMemberships = await ClubMembership.count({
      where: {
        createdAt: { [Op.gte]: thirtyDaysAgo },
        status: 'approved'
      }
    });

    // Event attendance rate
    const allParticipations = await EventParticipation.count();
    const attendedParticipations = await EventParticipation.count({
      where: { status: 'attended' }
    });
    const attendanceRate = allParticipations > 0 
      ? ((attendedParticipations / allParticipations) * 100).toFixed(1)
      : 0;

    // Top clubs by member count
    const topClubs = await Club.findAll({
      attributes: ['id', 'name'],
      limit: 5
    });

    // Get member counts for each club
    const topClubsWithCounts = await Promise.all(
      topClubs.map(async (club) => {
        const memberCount = await ClubMembership.count({
          where: { clubId: club.id, status: 'approved' }
        });
        return {
          id: club.id,
          name: club.name,
          memberCount
        };
      })
    );

    // Sort by member count
    topClubsWithCounts.sort((a, b) => b.memberCount - a.memberCount);

    res.json({
      totalUsers,
      totalClubs,
      totalEvents,
      totalActiveMembers,
      recentEvents,
      recentMemberships,
      attendanceRate: parseFloat(attendanceRate),
      topClubs: topClubsWithCounts
    });
  } catch (error) {
    console.error('System-wide analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch system analytics' });
  }
});

// Get club-specific analytics (Admin or Board of that club)
router.get('/club/:clubId', auth, async (req, res) => {
  try {
    const { clubId } = req.params;

    // Check permissions
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
        return res.status(403).json({ message: 'Not authorized to view this club analytics' });
      }
    }

    const club = await Club.findByPk(clubId);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Member statistics
    const totalMembers = await ClubMembership.count({
      where: { clubId, status: 'approved' }
    });

    const boardMembers = await ClubMembership.count({
      where: { clubId, status: 'approved', role: 'board' }
    });

    const pendingRequests = await ClubMembership.count({
      where: { clubId, status: 'pending' }
    });

    // Event statistics
    const totalEvents = await Event.count({ where: { ClubId: clubId } });
    
    const eventParticipations = await EventParticipation.count({
      include: [{
        model: Event,
        where: { ClubId: clubId },
        attributes: []
      }]
    });

    const attendedParticipations = await EventParticipation.count({
      where: { status: 'attended' },
      include: [{
        model: Event,
        where: { ClubId: clubId },
        attributes: []
      }]
    });

    const clubAttendanceRate = eventParticipations > 0
      ? ((attendedParticipations / eventParticipations) * 100).toFixed(1)
      : 0;

    // Member growth over last 6 months
    const memberGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const count = await ClubMembership.count({
        where: {
          clubId,
          status: 'approved',
          createdAt: { [Op.lte]: monthEnd }
        }
      });

      memberGrowth.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count
      });
    }

    // Most active members in this club
    const clubMembers = await ClubMembership.findAll({
      where: { clubId, status: 'approved' },
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });

    const activeMembersData = await Promise.all(
      clubMembers.map(async (membership) => {
        const eventsAttended = await EventParticipation.count({
          where: { UserId: membership.userId, status: 'attended' },
          include: [{
            model: Event,
            where: { ClubId: clubId },
            attributes: []
          }]
        });
        return {
          id: membership.User.id,
          name: membership.User.name,
          email: membership.User.email,
          eventsAttended
        };
      })
    );

    // Sort and limit
    const activeMembers = activeMembersData
      .sort((a, b) => b.eventsAttended - a.eventsAttended)
      .slice(0, 10);

    res.json({
      club: { id: club.id, name: club.name },
      totalMembers,
      boardMembers,
      pendingRequests,
      totalEvents,
      attendanceRate: parseFloat(clubAttendanceRate),
      memberGrowth,
      activeMembers
    });
  } catch (error) {
    console.error('Club analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch club analytics' });
  }
});

// Get event-specific analytics (Admin or Board of that club)
router.get('/event/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findByPk(eventId, {
      include: [{ model: Club, attributes: ['id', 'name'] }]
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check permissions
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
        return res.status(403).json({ message: 'Not authorized to view this event analytics' });
      }
    }

    // Participation statistics
    const totalRegistrations = await EventParticipation.count({
      where: { EventId: eventId }
    });

    const attended = await EventParticipation.count({
      where: { EventId: eventId, status: 'attended' }
    });

    const absent = await EventParticipation.count({
      where: { EventId: eventId, status: 'absent' }
    });

    const registered = await EventParticipation.count({
      where: { EventId: eventId, status: 'registered' }
    });

    const attendanceRate = totalRegistrations > 0
      ? ((attended / totalRegistrations) * 100).toFixed(1)
      : 0;

    const noShowRate = totalRegistrations > 0
      ? ((absent / totalRegistrations) * 100).toFixed(1)
      : 0;

    res.json({
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        venue: event.venue,
        points: event.points,
        club: event.Club
      },
      totalRegistrations,
      attended,
      absent,
      registered,
      attendanceRate: parseFloat(attendanceRate),
      noShowRate: parseFloat(noShowRate)
    });
  } catch (error) {
    console.error('Event analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch event analytics' });
  }
});

// Get member-specific analytics
router.get('/member/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Users can view their own stats, admins can view anyone's
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this member analytics' });
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'points']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Club memberships
    const totalClubs = await ClubMembership.count({
      where: { userId, status: 'approved' }
    });

    // Event statistics
    const totalEventsRegistered = await EventParticipation.count({
      where: { UserId: userId }
    });

    const totalEventsAttended = await EventParticipation.count({
      where: { UserId: userId, status: 'attended' }
    });

    const attendanceRate = totalEventsRegistered > 0
      ? ((totalEventsAttended / totalEventsRegistered) * 100).toFixed(1)
      : 0;

    // Points earned over last 6 months
    const pointsHistory = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthPoints = await EventParticipation.sum('Event.points', {
        where: {
          UserId: userId,
          status: 'attended',
          updatedAt: { [Op.between]: [monthStart, monthEnd] }
        },
        include: [{
          model: Event,
          attributes: []
        }]
      }) || 0;

      pointsHistory.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        points: monthPoints
      });
    }

    // Clubs participated in
    const memberships = await ClubMembership.findAll({
      where: { userId, status: 'approved' },
      include: [{
        model: Club,
        attributes: ['id', 'name']
      }],
      attributes: []
    });
    const clubs = memberships.map(m => m.Club);

    // Recent events attended
    const participations = await EventParticipation.findAll({
      where: { UserId: userId, status: 'attended' },
      include: [{
        model: Event,
        attributes: ['id', 'title', 'date', 'points'],
        include: [{
          model: Club,
          attributes: ['name']
        }]
      }],
      order: [['updatedAt', 'DESC']],
      limit: 5
    });
    const recentEvents = participations.map(p => ({
      id: p.Event.id,
      title: p.Event.title,
      date: p.Event.date,
      points: p.Event.points,
      Club: p.Event.Club
    }));

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        totalPoints: user.points
      },
      totalClubs,
      totalEventsRegistered,
      totalEventsAttended,
      attendanceRate: parseFloat(attendanceRate),
      pointsHistory,
      clubs,
      recentEvents
    });
  } catch (error) {
    console.error('Member analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch member analytics' });
  }
});

// Export club participation report as CSV (Admin only)
router.get('/export/club/:clubId', [auth, checkRole(['admin'])], async (req, res) => {
  try {
    const { clubId } = req.params;

    const club = await Club.findByPk(clubId);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    const members = await User.findAll({
      attributes: ['name', 'email', 'points'],
      include: [{
        model: ClubMembership,
        where: { clubId, status: 'approved' },
        attributes: ['role', 'createdAt']
      }]
    });

    // Create CSV content
    let csv = 'Name,Email,Role,Joined Date,Points\n';
    members.forEach(member => {
      const membership = member.ClubMemberships[0];
      csv += `"${member.name}","${member.email}","${membership.role}","${new Date(membership.createdAt).toLocaleDateString()}","${member.points}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${club.name}_members.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Failed to export report' });
  }
});

module.exports = router;
