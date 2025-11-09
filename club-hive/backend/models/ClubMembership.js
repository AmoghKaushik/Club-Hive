module.exports = (sequelize, DataTypes) => {
  const ClubMembership = sequelize.define('ClubMembership', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    role: {
      type: DataTypes.ENUM('member', 'club_head', 'president', 'secretary', 'volunteer'),
      defaultValue: 'member'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    }
  });

  return ClubMembership;
};