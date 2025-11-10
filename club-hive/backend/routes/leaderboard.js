const router = require('express').Router();
const { User } = require('../models');

// Get leaderboard - users sorted by points
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'points'],
      where: {
        role: { [require('sequelize').Op.ne]: 'admin' } // Exclude admins
      },
      order: [['points', 'DESC']],
      limit: 50 // Top 50 users
    });

    res.json(users);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;