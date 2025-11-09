module.exports = (sequelize, DataTypes) => {
  const EventParticipation = sequelize.define('EventParticipation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    status: {
      type: DataTypes.ENUM('registered', 'attended', 'absent'),
      defaultValue: 'registered'
    },
    pointsAwarded: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  });

  return EventParticipation;
};