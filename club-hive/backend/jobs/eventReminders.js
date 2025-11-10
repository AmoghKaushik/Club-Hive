const { Event, EventParticipation, User, Notification } = require('../models');
const { Op } = require('sequelize');

// Check for events happening in the next 24 hours and send reminders
async function sendEventReminders() {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find events happening in the next 24 hours
    const upcomingEvents = await Event.findAll({
      where: {
        date: {
          [Op.between]: [now, tomorrow]
        }
      }
    });

    console.log(`Found ${upcomingEvents.length} events in the next 24 hours`);

    // For each event, find all registered participants
    for (const event of upcomingEvents) {
      const participations = await EventParticipation.findAll({
        where: {
          EventId: event.id,
          status: 'registered'
        },
        include: [{ model: User, as: 'user' }]
      });

      console.log(`Event "${event.title}" has ${participations.length} registered participants`);

      // Create reminder notifications for each participant
      // Check if they already have a reminder notification
      for (const participation of participations) {
        const existingNotification = await Notification.findOne({
          where: {
            userId: participation.UserId,
            type: 'event_reminder',
            relatedId: event.id,
            relatedType: 'event'
          }
        });

        // Only create if no reminder exists yet
        if (!existingNotification) {
          const eventDate = new Date(event.date);
          const formattedDate = eventDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          });

          await Notification.create({
            userId: participation.UserId,
            type: 'event_reminder',
            title: 'Event Reminder',
            content: `Reminder: "${event.title}" is happening tomorrow at ${formattedDate}!`,
            isRead: false,
            relatedId: event.id,
            relatedType: 'event'
          });

          console.log(`Created reminder for user ${participation.UserId} for event "${event.title}"`);
        }
      }
    }
  } catch (error) {
    console.error('Error sending event reminders:', error);
  }
}

module.exports = { sendEventReminders };
