const router = require('express').Router();
const { Announcement, Club, User, ClubMembership, Notification } = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

// Helper function to create notifications for announcement
async function createNotificationsForAnnouncement(announcement, clubId) {
  try {
    let targetUserIds = [];

    if (clubId) {
      // Club-specific announcement: notify all club members
      const memberships = await ClubMembership.findAll({
        where: { clubId },
        attributes: ['userId']
      });
      targetUserIds = memberships.map(m => m.userId);
    } else {
      // Global announcement: notify all users except admins
      const users = await User.findAll({
        where: { role: { [Op.ne]: 'admin' } },
        attributes: ['id']
      });
      targetUserIds = users.map(u => u.id);
    }

    // Create notification for each user
    const notifications = targetUserIds.map(userId => ({
      userId,
      type: 'announcement',
      title: announcement.title,
      content: announcement.content.substring(0, 200), // Truncate to 200 chars
      relatedId: announcement.id,
      relatedType: 'announcement'
    }));

    await Notification.bulkCreate(notifications);
  } catch (error) {
    console.error('Error creating notifications:', error);
  }
}

// Create announcement
// Club admins/board can create club announcements
// Site admins can create club OR global announcements
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, clubId } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // If clubId is provided, verify permissions
    if (clubId) {
      // Check if user is club admin/board member OR site admin
      const membership = await ClubMembership.findOne({
        where: { userId: req.user.id, clubId }
      });

      const isSiteAdmin = req.user.role === 'admin';
      const isClubAdmin = membership && membership.role === 'board';

      if (!isSiteAdmin && !isClubAdmin) {
        return res.status(403).json({ message: 'Not authorized to post announcements for this club' });
      }
    } else {
      // Global announcement - only site admins
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only site admins can post global announcements' });
      }
    }

    const announcement = await Announcement.create({
      title,
      content,
      clubId: clubId || null,
      createdBy: req.user.id
    });

    // Create notifications for all relevant users
    await createNotificationsForAnnouncement(announcement, clubId);

    // Fetch the complete announcement with associations
    const fullAnnouncement = await Announcement.findByPk(announcement.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
        { model: Club, as: 'club', attributes: ['id', 'name'] }
      ]
    });

    res.status(201).json(fullAnnouncement);
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Failed to create announcement' });
  }
});

// Get announcements for current user
// Returns global announcements + announcements from user's clubs
// Admins see ALL announcements
router.get('/', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    let whereClause;

    if (req.user.role === 'admin') {
      // Admins see all announcements (no filter)
      whereClause = {};
    } else {
      // Regular users see global announcements + announcements from their clubs
      const memberships = await ClubMembership.findAll({
        where: { userId: req.user.id },
        attributes: ['clubId']
      });
      const userClubIds = memberships.map(m => m.clubId);

      whereClause = {
        [Op.or]: [
          { clubId: null }, // Global announcements
          { clubId: { [Op.in]: userClubIds } } // Club-specific announcements
        ]
      };
    }

    const announcements = await Announcement.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
        { model: Club, as: 'club', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json(announcements);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
});

// Get announcements for a specific club
router.get('/club/:clubId', auth, async (req, res) => {
  try {
    const { clubId } = req.params;

    // Verify user is a member of the club
    const membership = await ClubMembership.findOne({
      where: { userId: req.user.id, clubId }
    });

    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not a member of this club' });
    }

    const announcements = await Announcement.findAll({
      where: { clubId },
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
        { model: Club, as: 'club', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(announcements);
  } catch (error) {
    console.error('Get club announcements error:', error);
    res.status(500).json({ message: 'Failed to fetch club announcements' });
  }
});

// Delete announcement
router.delete('/:id', auth, async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Only creator or site admin can delete
    if (announcement.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this announcement' });
    }

    await announcement.destroy();
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ message: 'Failed to delete announcement' });
  }
});

module.exports = router;
