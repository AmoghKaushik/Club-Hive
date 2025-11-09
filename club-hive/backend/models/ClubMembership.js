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
    roleName: {
      type: DataTypes.ENUM(
        'Member',
        'President', 
        'Vice President', 
        'General Secretary', 
        'Treasurer', 
        'HR Head', 
        'PR Head', 
        'Managing Committee',
        'Working Committee',
        'Volunteer',
        'Other'
      ),
      defaultValue: 'Member',
      comment: 'Specific role title within the club'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    }
  });

  return ClubMembership;
};