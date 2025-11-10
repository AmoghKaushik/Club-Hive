module.exports = (sequelize, DataTypes) => {
  const Announcement = sequelize.define('Announcement', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    // If clubId is null, it's a global announcement (visible to all)
    clubId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Clubs',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    // User who created the announcement
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    }
  });

  Announcement.associate = (models) => {
    Announcement.belongsTo(models.Club, {
      foreignKey: 'clubId',
      as: 'club'
    });
    Announcement.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'author'
    });
  };

  return Announcement;
};
