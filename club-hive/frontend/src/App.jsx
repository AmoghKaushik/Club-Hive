
import { useState, useEffect } from 'react';
import { assignUserClubRole, getClubs, getEvents, getPendingMemberships, getUsers, getUserMemberships, promoteUser, updateMembershipStatus } from './api';
import './App.css';
import LoginPage from './LoginPage.jsx';
import RegisterPage from './RegisterPage.jsx';
import { useRouter } from './router.jsx';
import MyClubs from './components/MyClubs.jsx';
import EventsList from './components/EventsList.jsx';
import Leaderboard from './components/Leaderboard.jsx';

function App() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [pendingRequests, setPendingRequests] = useState({}); // clubId -> array
  const [users, setUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'clubs', 'events', 'leaderboard'
  const { route, navigate } = useRouter();

  // Fetch clubs when user logs in or token changes
  useEffect(() => {
    if (token && user) {
      fetchClubs();
    }
  }, [token, user]);

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
      
      if (memberships.length === 0) {
        alert(`${userName} is not a member of any clubs yet. They need to join a club first.`);
        return;
      }
      
      // Show clubs user is part of
      const clubOptions = memberships.map((m, i) => 
        `${i + 1}. ${m.Club.name} (Current role: ${m.role})`
      ).join('\n');
      
      const clubIdx = parseInt(prompt(`Select club to update role for ${userName}:\n${clubOptions}`), 10) - 1;
      if (isNaN(clubIdx) || clubIdx < 0 || clubIdx >= memberships.length) return;
      
      const selectedMembership = memberships[clubIdx];
      const clubId = selectedMembership.Club.id;
      const clubName = selectedMembership.Club.name;
      
      const role = prompt(
        `Select role for ${userName} in ${clubName}:\n` +
        `Type "board" for Board Member (can manage club)\n` +
        `Type "member" for Regular Member`,
        selectedMembership.role
      );
      
      if (!role || !['board', 'member'].includes(role.toLowerCase())) {
        alert('Invalid role. Must be "board" or "member"');
        return;
      }
      
      const result = await assignUserClubRole(userId, clubId, role.toLowerCase(), token);
      alert(result.message || `Role updated successfully!`);
      
      // Refresh if showing users list
      if (showUsers) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Role assignment error:', err);
      setError(err.message || 'Could not assign club role');
      alert('Error: ' + (err.message || 'Could not assign club role'));
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
    } catch (err) {
      setError('Could not update membership');
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
              onClick={() => setActiveTab('clubs')}
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

              <MyClubs token={token} />
              
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
                  <h3>Admin: Create Club</h3>
                  <button onClick={async () => {
                    const name = prompt('Club name?');
                    const description = prompt('Description?');
                    if (!name) return;
                    try {
                      const res = await fetch('http://localhost:5001/api/clubs', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ name, description })
                      });
                      if (!res.ok) throw new Error('Failed to create club');
                      fetchClubs();
                      alert('Club created successfully!');
                    } catch (err) {
                      setError('Could not create club');
                    }
                  }}>+ Create New Club</button>

                  <button style={{marginLeft:8}} onClick={() => { setShowUsers(v => !v); if (!showUsers) fetchUsers(); }}>
                    {showUsers ? 'Hide' : 'Manage User Roles'}
                  </button>

                  {showUsers && (
                    <div className="pending-box">
                      <b>All Users & Their Club Roles:</b>
                      <p style={{fontSize:'0.9em', color:'#666', marginTop:8}}>
                        Click "Manage Club Role" to assign users as Board members or regular Members for specific clubs.
                      </p>
                      <ul>
                        {users.length === 0 && <li>No users found</li>}
                        {users.map(u => (
                          <li key={u.id}>
                            {u.name} ({u.email}) - <span style={{fontWeight:'bold'}}>{u.role}</span>
                            <button style={{marginLeft:8}} onClick={() => handleAssignClubRole(u.id, u.name)}>
                              Manage Club Role
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
                    
                    return (
                    <li key={c.id}>
                      <h3>{c.name}</h3>
                      <p style={{color:'#888'}}>{c.description}</p>
                      {isMember && !canManageClub && (
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
                          } catch (err) {
                            setError('Could not send join request');
                          }
                        }}>Request to Join</button>
                      )}
                      {canManageClub && (
                        <>
                          <button style={{marginLeft:8}} onClick={async () => {
                            const title = prompt('Event title?');
                            const description = prompt('Description?');
                            const venue = prompt('Venue?');
                            const date = prompt('Date (YYYY-MM-DD)?');
                            if (!title || !venue || !date) return;
                            try {
                              const res = await fetch('http://localhost:5001/api/events', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({ title, description, venue, date, ClubId: c.id })
                              });
                              if (!res.ok) throw new Error('Failed to create event');
                              alert('Event created!');
                              setActiveTab('events');
                            } catch (err) {
                              setError('Could not create event');
                            }
                          }}>Create Event</button>
                          <button style={{marginLeft:8}} onClick={() => fetchPending(c.id)}>
                            Manage Requests
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
    </div>
  )
}

export default App
