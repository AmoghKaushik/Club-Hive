
import { useState } from 'react';
import { assignUserClubRole, getClubs, getEvents, getPendingMemberships, getUsers, promoteUser, updateMembershipStatus } from './api';
import './App.css';
import LoginPage from './LoginPage.jsx';
import RegisterPage from './RegisterPage.jsx';
import { useRouter } from './router.jsx';

function App() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [pendingRequests, setPendingRequests] = useState({}); // clubId -> array
  const [users, setUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);
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
          <div className="role-label">Welcome, {user?.name} ({user?.email})</div>
          <div className="role-label"><b>Role:</b> {user.role}</div>
          <div className="button-row">
            <button onClick={fetchClubs}>Show Clubs</button>
            <button onClick={fetchEvents}>Show Events</button>
            <button className="danger" onClick={()=>{setToken('');setUser(null);setClubs([]);setEvents([]);navigate('/login')}}>Logout</button>
          </div>
        </div>
      )}
      {user && (
        <div style={{marginTop: 16}}>
          <div className="role-label">Role: {user.role}</div>
          {isAdmin && <div className="info-text">You are an Admin. You can create/manage clubs and approve requests.</div>}
          {isClubHead && <div className="info-text">You are a Club Head. You can manage your club and events.</div>}
          {isMember && <div className="info-text">You are a Student Member. You can join clubs and RSVP to events.</div>}
        </div>
      )}
      {isAdmin && (
        <div style={{marginTop: 24}}>
          <h3>Create a New Club</h3>
          <form onSubmit={async e => {
            e.preventDefault();
            setError('');
            const name = prompt('Club name?');
            const description = prompt('Description?');
            if (!name) return;
            try {
              const res = await fetch('http://localhost:5000/api/clubs', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, description })
              });
              if (!res.ok) throw new Error('Failed to create club');
              fetchClubs();
            } catch (err) {
              setError('Could not create club');
            }
          }}>
            <button type="submit">Create Club</button>
          </form>
          <div style={{marginTop:24}}>
            <button onClick={() => { setShowUsers(v => !v); if (!showUsers) fetchUsers(); }}>
              {showUsers ? 'Hide Users' : 'Promote User to Club Head'}
            </button>
            {showUsers && (
              <div className="pending-box">
                <b>All Users:</b>
                <ul>
                  {users.length === 0 && <li>No users found</li>}
                  {users.map(u => (
                    <li key={u.id}>
                      {u.name} ({u.email}) - {u.role}
                      <button style={{marginLeft:8}} onClick={() => handleAssignClubRole(u.id)}>Assign Club Head (per club)</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      {isMember && clubs.length > 0 && (
        <div style={{marginTop: 24}}>
          <h3>Request to Join a Club</h3>
          <ul className="club-list">
            {clubs.map(c => (
              <li key={c.id}>
                {c.name} <button onClick={async () => {
                  setError('');
                  try {
                    const res = await fetch(`http://localhost:5000/api/clubs/${c.id}/join`, {
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
              </li>
            ))}
          </ul>
        </div>
      )}
      {clubs.length > 0 && user && (
        <div style={{marginTop: 24}}>
          <h3>Manage Club Events (Demo)</h3>
          <ul className="club-list">
            {clubs.map(c => {
              // Only show pending requests if user is club_head for this club
              let isClubHeadForClub = false;
              if (c.Users && user) {
                isClubHeadForClub = c.Users.some(u => u.id === user.id && u.ClubMembership?.role === 'club_head' && u.ClubMembership?.status === 'approved');
              }
              return (
                <li key={c.id}>
                  {c.name} <button onClick={async () => {
                    setError('');
                    const title = prompt('Event title?');
                    const description = prompt('Description?');
                    const venue = prompt('Venue?');
                    const date = prompt('Date (YYYY-MM-DD)?');
                    if (!title || !venue || !date) return;
                    try {
                      const res = await fetch('http://localhost:5000/api/events', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ title, description, venue, date, ClubId: c.id })
                      });
                      if (!res.ok) throw new Error('Failed to create event');
                      fetchEvents();
                    } catch (err) {
                      setError('Could not create event');
                    }
                  }}>Create Event</button>
                  {isClubHeadForClub && (
                    <button style={{marginLeft:8}} onClick={() => fetchPending(c.id)}>Show Pending Requests</button>
                  )}
                  {isClubHeadForClub && pendingRequests[c.id] && (
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
        </div>
      )}
      {isMember && events.length > 0 && (
        <div style={{marginTop: 24}}>
          <h3>RSVP to Events</h3>
          <ul className="event-list">
            {events.map(e => (
              <li key={e.id}>
                {e.title} <button onClick={async () => {
                  setError('');
                  try {
                    const res = await fetch(`http://localhost:5000/api/events/${e.id}/rsvp`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      }
                    });
                    if (!res.ok) throw new Error('Failed to RSVP');
                    alert('RSVP successful!');
                  } catch (err) {
                    setError('Could not RSVP');
                  }
                }}>RSVP</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {clubs.length > 0 && (
        <div style={{marginTop:24}}>
          <h2>Clubs</h2>
          <ul className="club-list">
            {clubs.map(c=>(<li key={c.id}>{c.name} <span style={{color:'#888'}}>- {c.description}</span></li>))}
          </ul>
        </div>
      )}
      {events.length > 0 && (
        <div style={{marginTop:24}}>
          <h2>Events</h2>
          <ul className="event-list">
            {events.map(e=>(<li key={e.id}>{e.title} <span style={{color:'#888'}}>- {e.venue} ({e.date})</span></li>))}
          </ul>
        </div>
      )}
      {user && (
        <div style={{marginTop: 32}}>
          <h2>Leaderboard</h2>
          <button onClick={async () => {
            setError('');
            try {
              const res = await fetch('http://localhost:5000/api/leaderboard', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (!res.ok) throw new Error('Failed to fetch leaderboard');
              const data = await res.json();
              alert('Top 10 Users:\n' + data.map((u, i) => `${i+1}. ${u.name} (${u.points} pts)`).join('\n'));
            } catch (err) {
              setError('Could not fetch leaderboard');
            }
          }}>Show Leaderboard</button>
        </div>
      )}
      {isAdmin && (
        <div style={{marginTop: 32}}>
          <h2>Export Reports</h2>
          <button onClick={async () => {
            setError('');
            try {
              const res = await fetch('http://localhost:5000/api/reports/participation', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (!res.ok) throw new Error('Failed to fetch report');
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'participation_report.csv';
              a.click();
              window.URL.revokeObjectURL(url);
            } catch (err) {
              setError('Could not export report');
            }
          }}>Export Participation Report (CSV)</button>
        </div>
      )}
    </div>
  )
}

export default App
