import { useState, useEffect } from 'react';
import { getMyClubs } from '../api';
import './MyClubs.css';

export default function MyClubs({ token }) {
  const [myClubs, setMyClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyClubs();
  }, [token]);

  async function fetchMyClubs() {
    setLoading(true);
    setError('');
    try {
      const data = await getMyClubs(token);
      setMyClubs(data);
    } catch (err) {
      setError('Failed to load your clubs');
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      approved: { text: 'Active', className: 'status-badge status-approved' },
      pending: { text: 'Pending', className: 'status-badge status-pending' },
      rejected: { text: 'Rejected', className: 'status-badge status-rejected' }
    };
    return badges[status] || badges.pending;
  };

  const getRoleBadge = (role) => {
    const badges = {
      board: { text: 'Board Member', className: 'role-badge role-board' },
      member: { text: 'Member', className: 'role-badge role-member' }
    };
    return badges[role] || badges.member;
  };

  if (loading) return <div className="loading">Loading your clubs...</div>;

  return (
    <div className="my-clubs-container">
      <h2>My Clubs</h2>
      {error && <div className="error-box">{error}</div>}
      
      {myClubs.length === 0 ? (
        <div className="empty-state">
          <p>You haven't joined any clubs yet.</p>
          <p>Browse available clubs below and request to join!</p>
        </div>
      ) : (
        <div className="clubs-grid">
          {myClubs.map((membership) => {
            const club = membership.Club;
            const status = getStatusBadge(membership.status);
            const role = getRoleBadge(membership.role);
            
            return (
              <div key={membership.id} className="club-card">
                <div className="club-header">
                  <h3>{club.name}</h3>
                  <span className={status.className}>{status.text}</span>
                </div>
                <p className="club-description">{club.description || 'No description available'}</p>
                <div className="club-footer">
                  <span className={role.className}>{role.text}</span>
                  <span className="join-date">
                    Joined {new Date(membership.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
