
import { useState, useEffect } from 'react';
import { assignUserClubRole, getClubs, getEvents, getPendingMemberships, getUsers, getUserMemberships, promoteUser, updateMembershipStatus, updateClub, deleteClub } from './api';
import './App.css';
import LoginPage from './LoginPage.jsx';
import RegisterPage from './RegisterPage.jsx';
import { useRouter } from './router.jsx';
import MyClubs from './components/MyClubs.jsx';
import EventsList from './components/EventsList.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import ManageMembers from './components/ManageMembers.jsx';
import ClubSelector from './components/ClubSelector.jsx';
import EventForm from './components/EventForm.jsx';
import ClubForm from './components/ClubForm.jsx';

function App() {
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token');
    return savedToken || '';
  });
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [pendingRequests, setPendingRequests] = useState({}); // clubId -> array
  const [users, setUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'clubs', 'events', 'leaderboard'
  const [managingClub, setManagingClub] = useState(null); // { clubId, clubName } for ManageMembers modal
  const [userMemberships, setUserMemberships] = useState([]); // User's club memberships with status
  const [clubSelectorMode, setClubSelectorMode] = useState(null); // 'edit' or 'delete'
  const [showEventForm, setShowEventForm] = useState(null); // { clubId, clubName } or null
  const [showClubForm, setShowClubForm] = useState(false); // true/false for create
  const [editingClub, setEditingClub] = useState(null); // club object for editing
  const { route, navigate } = useRouter();

  // Save token and user to localStorage whenever they change
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Fetch clubs when user logs in or token changes
  useEffect(() => {
    if (token && user) {
      fetchClubs();
      fetchUserMemberships();
      // Navigate to home if on login/register page
      if (route === '/login' || route === '/register') {
        navigate('/');
      }
    }
  }, [token, user]);

  async function fetchUserMemberships() {
    try {
      const data = await getUserMemberships(user.id, token);
      setUserMemberships(data);
    } catch (err) {
      // Not critical, just for UI enhancement
      console.error('Could not fetch memberships:', err);
    }
  }

  function isUserMemberOf(clubId) {
    return userMemberships.some(m => m.Club?.id === clubId && (m.status === 'approved' || m.status === 'pending'));
  }

  // Fetch all users (admin only)
  async function fetchUsers() {
    setError('');
    try {
      const data = await getUsers(token);
      setUsers(data);
    } catch (err) {
      setError('Could not fetch users');
    }
  }

  // Promote user to club head (global)
  async function handlePromote(userId) {
    setError('');
    try {
      await promoteUser(userId, 'club_head', token);
      fetchUsers();
      alert('User promoted to club head!');
    } catch (err) {
      setError('Could not promote user');
    }
  }

  // Assign user role for a specific club
  async function handleAssignClubRole(userId, userName) {
    setError('');
    try {
      // First get user's current memberships
      const memberships = await getUserMemberships(userId, token);
      
      console.log(`Fetched memberships for ${userName}:`, memberships);
      
      if (memberships.length === 0) {
        alert(`❌ ${userName} is not a member of any clubs yet.\n\nThey need to:\n1. Request to join a club\n2. Get approved by admin or board member\n3. Then you can assign them a role`);
        return;
      }
      
      // Show clubs user is part of
      const clubOptions = memberships.map((m, i) => 
        `${i + 1}. ${m.Club.name} (Current role: ${m.role})`
      ).join('\n');
      
      const clubSelection = prompt(
        `📋 Select a club to manage role for ${userName}:\n\n${clubOptions}\n\nEnter the number (1, 2, 3...):`
      );
      
      if (!clubSelection) return; // User cancelled
      
      const clubIdx = parseInt(clubSelection, 10) - 1;
      if (isNaN(clubIdx) || clubIdx < 0 || clubIdx >= memberships.length) {
        alert('❌ Invalid selection. Please try again.');
        return;
      }
      
      const selectedMembership = memberships[clubIdx];
      const clubId = selectedMembership.Club.id;
      const clubName = selectedMembership.Club.name;
      
      const roleSelection = prompt(
        `🎭 Select role for ${userName} in "${clubName}":\n\n` +
        `Current role: ${selectedMembership.role.toUpperCase()}\n\n` +
        `Options:\n` +
        `• Type "board" = Board Member (can create events, approve members)\n` +
        `• Type "member" = Regular Member (can attend events)\n\n` +
        `Enter your choice:`,
        selectedMembership.role
      );
      
      if (!roleSelection) return; // User cancelled
      
      const role = roleSelection.toLowerCase().trim();
      
      if (!['board', 'member'].includes(role)) {
        alert('❌ Invalid role. Must be "board" or "member"');
        return;
      }
      
      console.log(`Assigning role "${role}" to user ${userId} for club ${clubId}`);
      
      const result = await assignUserClubRole(userId, clubId, role, token);
      console.log('Assignment result:', result);
      
      alert(`✅ Success!\n\n${result.message || `${userName} is now a ${role.toUpperCase()} member of ${clubName}`}`);
      
      // Refresh if showing users list
      if (showUsers) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Role assignment error:', err);
      setError(err.message || 'Could not assign club role');
      alert('❌ Error: ' + (err.message || 'Could not assign club role'));
    }
  }
  // Fetch pending join requests for a club
  async function fetchPending(clubId) {
    setError('');
    try {
      const data = await getPendingMemberships(clubId, token);
      setPendingRequests(prev => ({ ...prev, [clubId]: data }));
    } catch (err) {
      setError('Could not fetch pending requests');
    }
  }

  // Approve/reject a join request
  async function handleMembership(clubId, userId, status) {
    setError('');
    try {
      await updateMembershipStatus(clubId, userId, status, token);
      fetchPending(clubId);
      if (status === 'approved') {
        // Refresh user memberships to update UI
        fetchUserMemberships();
      }
    } catch (err) {
      setError('Could not update membership');
    }
  }

  // Edit club (admin only)
  async function handleEditClub() {
    if (clubs.length === 0) {
      alert('No clubs available to edit');
      return;
    }
    setClubSelectorMode('edit');
  }

  async function onClubSelectedForEdit(club) {
    setClubSelectorMode(null);
    setEditingClub(club);
  }

  // Delete club (admin only)
  async function handleDeleteClub() {
    if (clubs.length === 0) {
      alert('No clubs available to delete');
      return;
    }
    setClubSelectorMode('delete');
  }

  async function onClubSelectedForDelete(club) {
    setClubSelectorMode(null);
    
    if (!confirm(`⚠️ Are you sure you want to delete "${club.name}"?\n\nThis will remove all members and events associated with this club.\n\nThis action cannot be undone!`)) {
      return;
    }
    
    try {
      await deleteClub(club.id, token);
      alert('Club deleted successfully!');
      fetchClubs();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  function handleLogin(token, user) {
    setToken(token);
    setUser(user);
    setError('');
    navigate('/');
  }

  function handleRegister(token, user) {
    setToken(token);
    setUser(user);
    setError('');
    navigate('/');
  }

  async function fetchClubs() {
    setError('')
    try {
      const data = await getClubs(token)
      setClubs(data)
    } catch (err) {
      setError('Could not fetch clubs')
    }
  }

  async function fetchEvents() {
    setError('')
    try {
      const data = await getEvents(token)
      setEvents(data)
    } catch (err) {
      setError('Could not fetch events')
    }
  }

  // Helper function to check if user is board member of a specific club
  function isUserBoardMember(clubId) {
    if (!user || !clubs.length) return false;
    const club = clubs.find(c => c.id === clubId);
    if (!club || !club.Users) return false;
    const membership = club.Users.find(u => u.id === user.id);
    return membership && membership.ClubMembership?.role === 'board';
  }

  // Role-based UI helpers
  const isAdmin = user?.role === 'admin';
  const isMember = user?.role === 'member';

  return (
    <div className="app-container">
      <h1>Club Hive</h1>
      {error && <div className="error-box">{error}</div>}
      {!token ? (
        <>
          {route === '/register' ? (
            <>
              <RegisterPage onRegister={handleRegister} setError={setError} />
              <div className="info-text">
                Already have an account?{' '}
                <button className="" style={{background:'none', color:'#1976d2', textDecoration:'underline'}} onClick={()=>navigate('/login')}>Login</button>
              </div>
            </>
          ) : (
            <>
              <LoginPage onLogin={handleLogin} setError={setError} />
              <div className="info-text">
                Don't have an account?{' '}
                <button className="" style={{background:'none', color:'#1976d2', textDecoration:'underline'}} onClick={()=>navigate('/register')}>Register</button>
              </div>
            </>
          )}
        </>
      ) : (
        <div style={{marginBottom:16}}>
          <div className="welcome-header">
            <div>
              <div className="role-label">Welcome, <strong>{user?.name}</strong></div>
              <div className="user-email">{user?.email}</div>
            </div>
            <button className="danger logout-btn" onClick={()=>{setToken('');setUser(null);setClubs([]);setEvents([]);setActiveTab('dashboard');navigate('/login')}}>Logout</button>
          </div>
          
          {/* Navigation Tabs */}
          <div className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              🏠 Dashboard
            </button>
            <button 
              className={`tab-btn ${activeTab === 'clubs' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('clubs');
                fetchUserMemberships(); // Refresh memberships when viewing clubs
              }}
            >
              🏛️ Clubs
            </button>
            <button 
              className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              📅 Events
            </button>
            <button 
              className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('leaderboard')}
            >
              🏆 Leaderboard
            </button>
          </div>
        </div>
      )}
      {user && (
        <div className="tab-content">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-tab">
              <div className="user-role-card">
                <h3>Your Account</h3>
                <div className="role-badge-large">{user.role.replace('_', ' ').toUpperCase()}</div>
                {isAdmin && <p>You are an Admin. You can create clubs, manage all users, and control everything.</p>}
                {isMember && <p>You are a Member. You can join clubs, RSVP to events, and earn points. Board members of clubs have additional privileges for their clubs.</p>}
              </div>

              {/* Only show My Clubs for non-admin users */}
              {!isAdmin && <MyClubs token={token} onCreateEvent={(clubId, clubName) => setShowEventForm({ clubId, clubName })} />}
              
              <div className="quick-stats">
                <h3>Quick Actions</h3>
                <div className="button-row">
                  <button onClick={() => setActiveTab('clubs')}>Browse Clubs</button>
                  <button onClick={() => setActiveTab('events')}>View Events</button>
                  <button onClick={() => setActiveTab('leaderboard')}>See Rankings</button>
                </div>
              </div>
            </div>
          )}

          {/* Clubs Tab */}
          {activeTab === 'clubs' && (
            <div className="clubs-tab">
              {isAdmin && (
                <div className="admin-section">
                  <h3>Admin: Manage Clubs</h3>
                  <button onClick={() => setShowClubForm(true)}>
                    + Create New Club
                  </button>

                  <button style={{marginLeft:8}} onClick={handleEditClub}>
                    Edit Club
                  </button>

                  <button style={{marginLeft:8}} onClick={handleDeleteClub}>
                    Delete Club
                  </button>
                </div>
              )}

              <h2>All Clubs</h2>
              <button onClick={fetchClubs} style={{marginBottom:16}}>Refresh Clubs</button>
              {clubs.length === 0 ? (
                <div className="empty-state"><p>No clubs available. {isAdmin && 'Create one above!'}</p></div>
              ) : (
                <ul className="club-list">
                  {clubs.map(c => {
                    const isBoardMember = isUserBoardMember(c.id);
                    const canManageClub = isAdmin || isBoardMember;
                    const membership = userMemberships.find(m => m.Club?.id === c.id);
                    const isApprovedMember = membership && membership.status === 'approved';
                    const isPendingMember = membership && membership.status === 'pending';
                    
                    // Debug logging
                    console.log(`Club: ${c.name}, Membership:`, membership, `Approved: ${isApprovedMember}, Pending: ${isPendingMember}`);
                    
                    return (
                    <li key={c.id}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:'8px'}}>
                        <h3 style={{margin:0}}>{c.name}</h3>
                        {c.category && (
                          <span style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {c.category}
                          </span>
                        )}
                      </div>
                      <p style={{color:'#888'}}>{c.description}</p>
                      
                      {/* Show member badge if already an approved member */}
                      {isApprovedMember && !canManageClub && (
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          background: '#e8f5e9',
                          color: '#2e7d32',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          marginBottom: '8px'
                        }}>
                          ✓ Member
                        </span>
                      )}
                      
                      {/* Show pending badge if request is pending */}
                      {isPendingMember && !canManageClub && (
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          background: '#fff3cd',
                          color: '#856404',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          marginBottom: '8px'
                        }}>
                          ⏳ Request Pending
                        </span>
                      )}
                      
                      {/* Join button only if not a member and not a manager */}
                      {isMember && !isApprovedMember && !isPendingMember && !canManageClub && (
                        <button onClick={async () => {
                          try {
                            const res = await fetch(`http://localhost:5001/api/clubs/${c.id}/join`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              }
                            });
                            if (!res.ok) throw new Error('Failed to request join');
                            alert('Join request sent!');
                            fetchUserMemberships();
                          } catch (err) {
                            setError('Could not send join request');
                          }
                        }}>Request to Join</button>
                      )}
                      
                      {canManageClub && (
                        <>
                          <button style={{marginLeft:0}} onClick={() => {
                            setShowEventForm({ clubId: c.id, clubName: c.name });
                          }}>Create Event</button>
                          <button style={{marginLeft:8}} onClick={() => fetchPending(c.id)}>
                            Manage Requests
                          </button>
                          <button style={{marginLeft:8}} onClick={() => setManagingClub({ clubId: c.id, clubName: c.name })}>
                            Manage Members
                          </button>
                        </>
                      )}
                      {pendingRequests[c.id] && (
                        <div className="pending-box">
                          <b>Pending Join Requests:</b>
                          <ul>
                            {pendingRequests[c.id].length === 0 && <li>No pending requests</li>}
                            {pendingRequests[c.id].map(req => (
                              <li key={req.id}>
                                {req.User?.name} ({req.User?.email})
                                <button className="success" style={{marginLeft:8}} onClick={() => handleMembership(c.id, req.userId, 'approved')}>Approve</button>
                                <button className="danger" style={{marginLeft:4}} onClick={() => handleMembership(c.id, req.userId, 'rejected')}>Reject</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="events-tab">
              <EventsList token={token} user={user} />
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="leaderboard-tab">
              <Leaderboard token={token} user={user} />
            </div>
          )}
        </div>
      )}
      
      {/* Manage Members Modal */}
      {managingClub && (
        <ManageMembers
          clubId={managingClub.clubId}
          clubName={managingClub.clubName}
          token={token}
          isAdmin={isAdmin}
          onClose={() => setManagingClub(null)}
        />
      )}
      
      {/* Club Selector Modal */}
      {clubSelectorMode === 'edit' && (
        <ClubSelector
          clubs={clubs}
          title="Select Club to Edit"
          onSelect={onClubSelectedForEdit}
          onCancel={() => setClubSelectorMode(null)}
        />
      )}
      
      {clubSelectorMode === 'delete' && (
        <ClubSelector
          clubs={clubs}
          title="Select Club to Delete"
          onSelect={onClubSelectedForDelete}
          onCancel={() => setClubSelectorMode(null)}
        />
      )}

      {/* Event Form Modal */}
      {showEventForm && (
        <EventForm
          clubId={showEventForm.clubId}
          clubName={showEventForm.clubName}
          token={token}
          onSuccess={() => {
            setShowEventForm(null);
            fetchClubs();
            setActiveTab('events');
          }}
          onCancel={() => setShowEventForm(null)}
        />
      )}

      {/* Club Form Modal - Create */}
      {showClubForm && (
        <ClubForm
          token={token}
          onSuccess={() => {
            setShowClubForm(false);
            fetchClubs();
          }}
          onCancel={() => setShowClubForm(false)}
        />
      )}

      {/* Club Form Modal - Edit */}
      {editingClub && (
        <ClubForm
          token={token}
          editMode={true}
          initialData={editingClub}
          onSuccess={() => {
            setEditingClub(null);
            fetchClubs();
          }}
          onCancel={() => setEditingClub(null)}
        />
      )}
    </div>
  )
}

export default App
