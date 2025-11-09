module.exports = (sequelize, DataTypes) => {
  const ClubMembership = sequelize.define('ClubMembership', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    role: {
      type: DataTypes.ENUM('member', 'board'),
      defaultValue: 'member',
      comment: 'board = club leaders who can manage club, member = regular members'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    }
  });

  return ClubMembership;
};