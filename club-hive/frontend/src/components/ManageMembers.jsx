import { useState, useEffect } from 'react';
import { getClubMembers, updateMemberRole, removeMemberFromClub } from '../api';
import './ManageMembers.css';

const BOARD_ROLES = ['President', 'Vice President', 'General Secretary', 'Treasurer', 'HR Head', 'PR Head'];
const MEMBER_ROLES = ['Member', 'Managing Committee', 'Working Committee', 'Volunteer'];
const FLEXIBLE_ROLES = ['Other'];

export default function ManageMembers({ clubId, clubName, token, isAdmin, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMembers();
  }, [clubId]);

  async function fetchMembers() {
    setLoading(true);
    setError('');
    try {
      const data = await getClubMembers(clubId, token);
      setMembers(data);
    } catch (err) {
      setError(err.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId, role, roleName) {
    setError('');
    try {
      await updateMemberRole(clubId, userId, role, roleName, token);
      fetchMembers();
      alert('Role updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update role');
      alert('Error: ' + (err.message || 'Failed to update role'));
    }
  }

  async function handleRemoveMember(userId, userName) {
    if (!confirm(`Are you sure you want to remove ${userName} from ${clubName}?`)) {
      return;
    }
    
    setError('');
    try {
      await removeMemberFromClub(clubId, userId, token);
      fetchMembers();
      alert('Member removed successfully!');
    } catch (err) {
      setError(err.message || 'Failed to remove member');
    }
  }

  const getAvailableRoleNames = (roleType) => {
    if (roleType === 'board') {
      return [...BOARD_ROLES, ...FLEXIBLE_ROLES];
    } else {
      return MEMBER_ROLES;
    }
  };

  if (loading) return <div className="manage-members-overlay"><div className="manage-members-modal"><p>Loading members...</p></div></div>;

  return (
    <div className="manage-members-overlay" onClick={onClose}>
      <div className="manage-members-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Members - {clubName}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="members-list">
          {members.length === 0 ? (
            <p className="empty-state">No members in this club yet.</p>
          ) : (
            members.map((membership) => {
              const user = membership.User;
              return (
                <div key={membership.id} className="member-item">
                  <div className="member-info">
                    <div className="member-avatar">{user.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="member-name">{user.name}</div>
                      <div className="member-email">{user.email}</div>
                    </div>
                  </div>

                  {isAdmin ? (
                    <div className="member-controls">
                      <select
                        value={membership.role}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          const newRoleName = newRole === 'board' ? 'President' : 'Member';
                          handleRoleChange(user.id, newRole, newRoleName);
                        }}
                        className="role-select"
                      >
                        <option value="member">Member</option>
                        <option value="board">Board</option>
                      </select>

                      <select
                        value={membership.roleName}
                        onChange={(e) => handleRoleChange(user.id, membership.role, e.target.value)}
                        className="role-name-select"
                      >
                        {getAvailableRoleNames(membership.role).map(roleName => (
                          <option key={roleName} value={roleName}>{roleName}</option>
                        ))}
                      </select>

                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveMember(user.id, user.name)}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="member-role-display">
                      <span className={`role-badge ${membership.role === 'board' ? 'board' : 'member'}`}>
                        {membership.roleName}
                      </span>
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveMember(user.id, user.name)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
