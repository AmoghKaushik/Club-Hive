import { useState, useEffect } from 'react';
import { getMyClubs, getPendingMemberships, updateMembershipStatus } from '../api';
import ManageMembers from './ManageMembers';
import './MyClubs.css';

export default function MyClubs({ token, onCreateEvent }) {
  const [myClubs, setMyClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [memberships, setMemberships] = useState([]);
  const [managingClub, setManagingClub] = useState(null);
  const [pendingRequests, setPendingRequests] = useState({});
  const [showPendingFor, setShowPendingFor] = useState(null);

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

  async function fetchPending(clubId) {
    setError('');
    try {
      const data = await getPendingMemberships(clubId, token);
      setPendingRequests(prev => ({ ...prev, [clubId]: data }));
      setShowPendingFor(showPendingFor === clubId ? null : clubId); // Toggle display
    } catch (err) {
      setError('Could not fetch pending requests');
    }
  }

  async function handleMembership(clubId, userId, status) {
    setError('');
    try {
      await updateMembershipStatus(clubId, userId, status, token);
      fetchPending(clubId);
    } catch (err) {
      setError('Could not update membership');
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

  const getRoleBadge = (role, roleName) => {
    const badges = {
      board: { text: roleName || 'Board Member', className: 'role-badge role-board' },
      member: { text: roleName || 'Member', className: 'role-badge role-member' }
    };
    return badges[role] || badges.member;
  };

  if (loading) return <div className="loading">Loading your clubs...</div>;

  return (
    <>
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
              const role = getRoleBadge(membership.role, membership.roleName);
              const isBoard = membership.role === 'board' && membership.status === 'approved';
              
              return (
                <div key={membership.id} className="club-card">
                  <div className="club-header">
                    <div style={{display:'flex', flexDirection:'column', gap:'4px', flex:1}}>
                      <h3 style={{margin:0}}>{club.name}</h3>
                      {club.category && (
                        <span style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          padding: '3px 10px',
                          borderRadius: '10px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          width: 'fit-content'
                        }}>
                          {club.category}
                        </span>
                      )}
                    </div>
                    <span className={status.className}>{status.text}</span>
                  </div>
                  <p className="club-description">{club.description || 'No description available'}</p>
                  <div className="club-footer">
                    <span className={role.className}>{role.text}</span>
                    <span className="join-date">
                      Joined {new Date(membership.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {isBoard && (
                    <div style={{marginTop: '12px', display: 'flex', gap: '8px', flexDirection: 'column'}}>
                      <button 
                        className="manage-btn"
                        onClick={() => onCreateEvent && onCreateEvent(club.id, club.name)}
                      >
                        Create Event
                      </button>
                      <button 
                        className="manage-btn"
                        onClick={() => fetchPending(club.id)}
                      >
                        Manage Join Requests
                      </button>
                      <button 
                        className="manage-btn"
                        onClick={() => setManagingClub({ clubId: club.id, clubName: club.name })}
                      >
                        Manage Members
                      </button>
                    </div>
                  )}
                  
                  {/* Show pending requests */}
                  {isBoard && showPendingFor === club.id && pendingRequests[club.id] && (
                    <div style={{marginTop: '12px', padding: '12px', background: '#f9f9f9', borderRadius: '6px'}}>
                      <h4 style={{margin: '0 0 8px 0'}}>Pending Join Requests:</h4>
                      {pendingRequests[club.id].length === 0 ? (
                        <p style={{margin: 0, color: '#666'}}>No pending requests</p>
                      ) : (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                          {pendingRequests[club.id].map(req => (
                            <div key={req.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'white', borderRadius: '4px'}}>
                              <span>{req.User?.name} ({req.User?.email})</span>
                              <div style={{display: 'flex', gap: '4px'}}>
                                <button 
                                  className="success" 
                                  style={{padding: '4px 12px', fontSize: '0.85rem'}} 
                                  onClick={() => handleMembership(club.id, req.userId, 'approved')}
                                >
                                  Approve
                                </button>
                                <button 
                                  className="danger" 
                                  style={{padding: '4px 12px', fontSize: '0.85rem'}} 
                                  onClick={() => handleMembership(club.id, req.userId, 'rejected')}
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {managingClub && (
        <ManageMembers
          clubId={managingClub.clubId}
          clubName={managingClub.clubName}
          token={token}
          isAdmin={false}
          onClose={() => setManagingClub(null)}
        />
      )}
    </>
  );
}
