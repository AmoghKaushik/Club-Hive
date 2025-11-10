const { Sequelize } = require('sequelize');
const configAll = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const config = configAll[env];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  port: config.port,
});

const db = {
  sequelize,
  Sequelize,
  User: require('./User')(sequelize, Sequelize),
  Club: require('./Club')(sequelize, Sequelize),
  Event: require('./Event')(sequelize, Sequelize),
  ClubMembership: require('./ClubMembership')(sequelize, Sequelize),
  EventParticipation: require('./EventParticipation')(sequelize, Sequelize),
  Announcement: require('./Announcement')(sequelize, Sequelize),
  Notification: require('./Notification')(sequelize, Sequelize),
};

// Associations

db.User.belongsToMany(db.Club, { through: db.ClubMembership });
db.Club.belongsToMany(db.User, { through: db.ClubMembership });
// Add direct associations for eager loading
db.ClubMembership.belongsTo(db.User, { foreignKey: 'userId' });
db.ClubMembership.belongsTo(db.Club, { foreignKey: 'clubId' });

db.Club.hasMany(db.Event);
db.Event.belongsTo(db.Club);

db.User.belongsToMany(db.Event, { through: db.EventParticipation });
db.Event.belongsToMany(db.User, { through: db.EventParticipation });
// Add direct associations for eager loading
db.EventParticipation.belongsTo(db.User, { foreignKey: 'UserId' });
db.EventParticipation.belongsTo(db.Event, { foreignKey: 'EventId' });

// Announcement associations
db.Announcement.belongsTo(db.Club, { foreignKey: 'clubId', as: 'club' });
db.Announcement.belongsTo(db.User, { foreignKey: 'createdBy', as: 'author' });
db.Club.hasMany(db.Announcement, { foreignKey: 'clubId' });
db.User.hasMany(db.Announcement, { foreignKey: 'createdBy' });

// Notification associations
db.Notification.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
db.User.hasMany(db.Notification, { foreignKey: 'userId' });

module.exports = db;