const router = require('express').Router();
const { Event, Club } = require('../models');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Get all events
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.findAll({ include: [Club] });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create event (Admin only)
router.post('/', [auth, checkRole(['admin'])], async (req, res) => {
  try {
    const { title, description, venue, date, ClubId } = req.body;
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