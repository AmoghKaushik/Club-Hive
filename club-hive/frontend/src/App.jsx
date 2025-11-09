
import { useState } from 'react';
import { assignUserClubRole, getClubs, getEvents, getPendingMemberships, getUsers, promoteUser, updateMembershipStatus } from './api';
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

  // Assign user as club_head/president/secretary for a specific club
  async function handleAssignClubRole(userId) {
    setError('');
    try {
      if (clubs.length === 0) {
        await fetchClubs();
      }
      const clubOptions = clubs.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
      const clubIdx = parseInt(prompt(`Select club for this user:\n${clubOptions}`), 10) - 1;
      if (isNaN(clubIdx) || clubIdx < 0 || clubIdx >= clubs.length) return;
      const clubId = clubs[clubIdx].id;
      const role = prompt('Enter role: club_head, president, or secretary', 'club_head');
      if (!['club_head', 'president', 'secretary'].includes(role)) {
        alert('Invalid role');
        return;
      }
      await assignUserClubRole(userId, clubId, role, token);
      alert(`User assigned as ${role} for club ${clubs[clubIdx].name}`);
    } catch (err) {
      setError('Could not assign club role');
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

  // Role-based UI helpers
  const isAdmin = user?.role === 'admin';
  const isClubHead = user?.role === 'club_head' || user?.role === 'president' || user?.role === 'secretary';
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
                <h3>Your Role</h3>
                <div className="role-badge-large">{user.role.replace('_', ' ').toUpperCase()}</div>
                {isAdmin && <p>You are an Admin. You can create/manage clubs and approve requests.</p>}
                {isClubHead && <p>You are a Club Head. You can manage your club and events.</p>}
                {isMember && <p>You are a Student Member. You can join clubs and RSVP to events.</p>}
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
                      <b>All Users:</b>
                      <ul>
                        {users.length === 0 && <li>No users found</li>}
                        {users.map(u => (
                          <li key={u.id}>
                            {u.name} ({u.email}) - {u.role}
                            <button style={{marginLeft:8}} onClick={() => handleAssignClubRole(u.id)}>Assign Club Role</button>
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
                  {clubs.map(c => (
                    <li key={c.id}>
                      <h3>{c.name}</h3>
                      <p style={{color:'#888'}}>{c.description}</p>
                      {isMember && (
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
                      {(isAdmin || isClubHead) && (
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
                  ))}
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
