import { useState, useEffect, useRef } from 'react';
import './Analytics.css';

const API_BASE = 'http://localhost:5001/api';

const Analytics = () => {
  let currentUser = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      currentUser = JSON.parse(userStr);
    }
  } catch (error) {
    console.error('Failed to parse user from localStorage:', error);
    currentUser = null;
  }
  
  const isAdmin = currentUser?.role === 'admin';
  const isFirstRender = useRef(true);
  
  console.log('Analytics component loaded. User:', currentUser, 'isAdmin:', isAdmin);
  
  // Set default tab based on user role (will be updated by useEffect)
  const [activeTab, setActiveTab] = useState(isAdmin ? 'system' : 'member');
  const [systemAnalytics, setSystemAnalytics] = useState(null);
  const [clubAnalytics, setClubAnalytics] = useState(null);
  const [eventAnalytics, setEventAnalytics] = useState(null);
  const [memberAnalytics, setMemberAnalytics] = useState(null);
  
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedClub, setSelectedClub] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Check if user is a board member of any club
  const [isBoardMember, setIsBoardMember] = useState(false);
  const [boardClubs, setBoardClubs] = useState([]);

  useEffect(() => {
    checkBoardMembership();
  }, []);

  // Update default tab when board membership is determined
  useEffect(() => {
    if (!isAdmin && isBoardMember && activeTab === 'member') {
      setActiveTab('club');
    }
  }, [isBoardMember, isAdmin]);

  const checkBoardMembership = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/clubs/my-clubs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const myClubs = await response.json();
        const boardClubsList = myClubs.filter(c => c.role === 'board');
        setIsBoardMember(boardClubsList.length > 0);
        setBoardClubs(boardClubsList);
      }
    } catch (err) {
      console.error('Failed to check board membership:', err);
    }
  };

  // Fetch system-wide analytics (admin only)
  const fetchSystemAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/analytics/system-wide`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setSystemAnalytics(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch system analytics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch club analytics
  const fetchClubAnalytics = async (clubId) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/analytics/club/${clubId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setClubAnalytics(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch club analytics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch event analytics
  const fetchEventAnalytics = async (eventId) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/analytics/event/${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setEventAnalytics(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch event analytics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user analytics
  const fetchMemberAnalytics = async (userId) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/analytics/member/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setMemberAnalytics(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch user analytics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch clubs for dropdown
  const fetchClubs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/clubs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch clubs');
      const data = await response.json();
      setClubs(data);
    } catch (err) {
      console.error('Failed to fetch clubs:', err);
    }
  };

  // Fetch events for dropdown
  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  };

  // Export club report
  const exportClubReport = async (clubId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/analytics/export/club/${clubId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to export report');
      
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `club_report_${clubId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export report');
    }
  };

  // Combined effect for initial load and tab changes
  useEffect(() => {
    console.log('=== MAIN useEffect RUNNING ===');
    console.log('isFirstRender:', isFirstRender.current);
    console.log('activeTab:', activeTab);
    console.log('isAdmin:', isAdmin);
    console.log('currentUser:', currentUser);
    
    // Safety check - if no user, don't proceed
    if (!currentUser) {
      console.error('No currentUser found - cannot fetch analytics');
      setError('Please login to view analytics');
      return;
    }
    
    // On first render, fetch clubs and events
    if (isFirstRender.current) {
      console.log('First render - fetching clubs and events');
      fetchClubs();
      fetchEvents();
      isFirstRender.current = false;
    }
    
    // Always handle the active tab
    if (activeTab === 'system' && isAdmin) {
      console.log('>>>Fetching system analytics...');
      fetchSystemAnalytics();
    } else if (activeTab === 'member') {
      console.log('>>>Should fetch user analytics');
      if (currentUser?.id) {
        console.log('>>>Actually calling fetchMemberAnalytics for:', currentUser.id);
        fetchMemberAnalytics(currentUser.id);
        setSelectedMember(currentUser.id);
      } else {
        console.error('>>>No currentUser.id available!');
      }
    } else {
      console.log('>>>Tab is:', activeTab, '- no auto-fetch');
    }
    console.log('=== END useEffect ===');
  }, [activeTab]);

  return (
    <div className="analytics-container">
      <h1>📊 Analytics Dashboard</h1>

      {/* Tab Navigation */}
      <div className="analytics-tabs">
        {isAdmin && (
          <button
            className={activeTab === 'system' ? 'tab-active' : ''}
            onClick={() => setActiveTab('system')}
          >
            System-Wide
          </button>
        )}
        {(isAdmin || isBoardMember) && (
          <button
            className={activeTab === 'club' ? 'tab-active' : ''}
            onClick={() => setActiveTab('club')}
          >
            Club Analytics
          </button>
        )}
        {(isAdmin || isBoardMember) && (
          <button
            className={activeTab === 'event' ? 'tab-active' : ''}
            onClick={() => setActiveTab('event')}
          >
            Event Analytics
          </button>
        )}
        {!isAdmin && (
          <button
            className={activeTab === 'member' ? 'tab-active' : ''}
            onClick={() => {
              console.log('User Analytics button clicked, setting activeTab to member');
              setActiveTab('member');
            }}
          >
            User Analytics
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* System-Wide Analytics (Admin Only) */}
      {activeTab === 'system' && isAdmin && (
        <div className="analytics-section">
          <h2>System-Wide Statistics</h2>
          {loading ? (
            <p>Loading...</p>
          ) : systemAnalytics ? (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Users</h3>
                  <p className="stat-number">{systemAnalytics.totalUsers}</p>
                </div>
                <div className="stat-card">
                  <h3>Total Clubs</h3>
                  <p className="stat-number">{systemAnalytics.totalClubs}</p>
                </div>
                <div className="stat-card">
                  <h3>Total Events</h3>
                  <p className="stat-number">{systemAnalytics.totalEvents}</p>
                </div>
                <div className="stat-card">
                  <h3>Active Members</h3>
                  <p className="stat-number">{systemAnalytics.totalActiveMembers}</p>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Recent Events (30 days)</h3>
                  <p className="stat-number">{systemAnalytics.recentEvents}</p>
                </div>
                <div className="stat-card">
                  <h3>New Memberships (30 days)</h3>
                  <p className="stat-number">{systemAnalytics.recentMemberships}</p>
                </div>
                <div className="stat-card">
                  <h3>Attendance Rate</h3>
                  <p className="stat-number">{systemAnalytics.attendanceRate}%</p>
                </div>
              </div>

              <div className="top-clubs">
                <h3>Top 5 Clubs by Members</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Club Name</th>
                      <th>Members</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemAnalytics.topClubs?.map((club) => (
                      <tr key={club.id}>
                        <td>{club.name}</td>
                        <td>{club.memberCount || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p>No data available</p>
          )}
        </div>
      )}

      {/* Club Analytics */}
      {activeTab === 'club' && (
        <div className="analytics-section">
          <div className="section-header">
            <h2>📊 Club Performance Analytics</h2>
            <p className="subtitle">Deep dive into individual club statistics and member engagement</p>
          </div>
          
          <div className="selector-row">
            <div className="select-wrapper">
              <label>Select Club:</label>
              <select
                value={selectedClub}
                onChange={(e) => {
                  setSelectedClub(e.target.value);
                  if (e.target.value) fetchClubAnalytics(e.target.value);
                }}
              >
                <option value="">Choose a club to analyze</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
            {isAdmin && selectedClub && (
              <button
                onClick={() => exportClubReport(selectedClub)}
                className="export-btn"
              >
                📥 Export Report
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading analytics data...</p>
            </div>
          ) : clubAnalytics ? (
            <>
              <div className="club-header">
                <h3>🏛️ {clubAnalytics.club?.name}</h3>
                <p className="club-subtitle">Comprehensive performance metrics and insights</p>
              </div>

              {/* Key Metrics Cards */}
              <div className="metrics-section">
                <h4>📈 Key Metrics</h4>
                <div className="stats-grid">
                  <div className="stat-card stat-primary">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                      <h3>Total Members</h3>
                      <p className="stat-number">{clubAnalytics.totalMembers}</p>
                      <span className="stat-label">Active members</span>
                    </div>
                  </div>
                  <div className="stat-card stat-secondary">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-content">
                      <h3>Board Members</h3>
                      <p className="stat-number">{clubAnalytics.boardMembers}</p>
                      <span className="stat-label">Leadership team</span>
                    </div>
                  </div>
                  <div className="stat-card stat-warning">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                      <h3>Pending Requests</h3>
                      <p className="stat-number">{clubAnalytics.pendingRequests}</p>
                      <span className="stat-label">Awaiting approval</span>
                    </div>
                  </div>
                  <div className="stat-card stat-info">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                      <h3>Total Events</h3>
                      <p className="stat-number">{clubAnalytics.totalEvents}</p>
                      <span className="stat-label">Events organized</span>
                    </div>
                  </div>
                  <div className="stat-card stat-success">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                      <h3>Attendance Rate</h3>
                      <p className="stat-number">{clubAnalytics.attendanceRate}%</p>
                      <span className="stat-label">Event participation</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Member Growth Chart */}
              <div className="chart-section">
                <h4>📊 Member Growth Trend</h4>
                <p className="chart-subtitle">Track membership growth over the last 6 months</p>
                <div className="growth-chart-modern">
                  {clubAnalytics.memberGrowth?.map((data, index) => {
                    const maxCount = Math.max(...clubAnalytics.memberGrowth.map(d => d.count));
                    const height = maxCount > 0 ? (data.count / maxCount) * 100 : 0;
                    return (
                      <div key={index} className="growth-bar-container">
                        <div className="growth-bar-wrapper">
                          <div 
                            className="growth-bar-fill" 
                            style={{ height: `${Math.max(height, 5)}%` }}
                          >
                            <span className="growth-tooltip">{data.count} members</span>
                          </div>
                        </div>
                        <div className="growth-label">{data.month}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Members Table */}
              <div className="table-section">
                <h4>🏆 Top Active Members</h4>
                <p className="table-subtitle">Members with highest event participation</p>
                {clubAnalytics.activeMembers && clubAnalytics.activeMembers.length > 0 ? (
                  <div className="modern-table">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Member Name</th>
                          <th>Email</th>
                          <th>Events Attended</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clubAnalytics.activeMembers.map((member, index) => (
                          <tr key={member.id}>
                            <td className="rank-cell">
                              {index === 0 && '🥇'}
                              {index === 1 && '🥈'}
                              {index === 2 && '🥉'}
                              {index > 2 && index + 1}
                            </td>
                            <td className="name-cell">{member.name}</td>
                            <td className="email-cell">{member.email}</td>
                            <td className="number-cell">
                              <span className="badge">{member.eventsAttended}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No active member data available yet</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state-large">
              <div className="empty-icon">📊</div>
              <h3>No Club Selected</h3>
              <p>Please select a club from the dropdown above to view detailed analytics</p>
            </div>
          )}
        </div>
      )}

      {/* Event Analytics */}
      {activeTab === 'event' && (
        <div className="analytics-section">
          <div className="section-header">
            <h2>📅 Event Performance Analytics</h2>
            <p className="subtitle">Analyze attendance and participation metrics for individual events</p>
          </div>
          
          <div className="selector-row">
            <div className="select-wrapper">
              <label>Select Event:</label>
              <select
                value={selectedEvent}
                onChange={(e) => {
                  setSelectedEvent(e.target.value);
                  if (e.target.value) fetchEventAnalytics(e.target.value);
                }}
              >
                <option value="">Choose an event to analyze</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} - {new Date(event.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading event analytics...</p>
            </div>
          ) : eventAnalytics ? (
            <>
              <div className="club-header">
                <h3>🎯 {eventAnalytics.event?.title}</h3>
                <p className="club-subtitle">
                  📅 {new Date(eventAnalytics.event?.date).toLocaleString()} | 
                  📍 {eventAnalytics.event?.venue} | 
                  ⭐ {eventAnalytics.event?.points} points | 
                  🏛️ {eventAnalytics.event?.club?.name}
                </p>
              </div>

              {/* Participation Metrics */}
              <div className="metrics-section">
                <h4>👥 Participation Overview</h4>
                <div className="stats-grid">
                  <div className="stat-card stat-primary">
                    <div className="stat-icon">📝</div>
                    <div className="stat-content">
                      <h3>Total Registrations</h3>
                      <p className="stat-number">{eventAnalytics.totalRegistrations}</p>
                      <span className="stat-label">People signed up</span>
                    </div>
                  </div>
                  <div className="stat-card stat-success">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                      <h3>Attended</h3>
                      <p className="stat-number">{eventAnalytics.attended}</p>
                      <span className="stat-label">Confirmed attendance</span>
                    </div>
                  </div>
                  <div className="stat-card stat-warning">
                    <div className="stat-icon">❌</div>
                    <div className="stat-content">
                      <h3>Absent</h3>
                      <p className="stat-number">{eventAnalytics.absent}</p>
                      <span className="stat-label">No-shows</span>
                    </div>
                  </div>
                  <div className="stat-card stat-info">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                      <h3>Registered</h3>
                      <p className="stat-number">{eventAnalytics.registered}</p>
                      <span className="stat-label">Pending attendance</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Rates */}
              <div className="metrics-section">
                <h4>📊 Performance Rates</h4>
                <div className="stats-grid">
                  <div className="stat-card stat-success">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                      <h3>Attendance Rate</h3>
                      <p className="stat-number">{eventAnalytics.attendanceRate}%</p>
                      <span className="stat-label">People who attended</span>
                    </div>
                  </div>
                  <div className="stat-card stat-warning">
                    <div className="stat-icon">📉</div>
                    <div className="stat-content">
                      <h3>No-Show Rate</h3>
                      <p className="stat-number">{eventAnalytics.noShowRate}%</p>
                      <span className="stat-label">Missed the event</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state-large">
              <div className="empty-icon">📅</div>
              <h3>No Event Selected</h3>
              <p>Please select an event from the dropdown above to view detailed analytics</p>
            </div>
          )}
        </div>
      )}

      {/* User Analytics */}
      {activeTab === 'member' && (
        <div className="analytics-section">
          <h2>User Analytics</h2>
          
          {loading ? (
            <p>Loading...</p>
          ) : memberAnalytics ? (
            <>
              <h3>{memberAnalytics.user?.name}</h3>
              <p><strong>Email:</strong> {memberAnalytics.user?.email}</p>

              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Points</h3>
                  <p className="stat-number">{memberAnalytics.user?.totalPoints}</p>
                </div>
                <div className="stat-card">
                  <h3>Clubs Joined</h3>
                  <p className="stat-number">{memberAnalytics.totalClubs}</p>
                </div>
                <div className="stat-card">
                  <h3>Events Registered</h3>
                  <p className="stat-number">{memberAnalytics.totalEventsRegistered}</p>
                </div>
                <div className="stat-card">
                  <h3>Events Attended</h3>
                  <p className="stat-number">{memberAnalytics.totalEventsAttended}</p>
                </div>
                <div className="stat-card">
                  <h3>Attendance Rate</h3>
                  <p className="stat-number">{memberAnalytics.attendanceRate}%</p>
                </div>
              </div>

              <div className="points-history">
                <h3>Points Earned (Last 6 Months)</h3>
                <div className="points-chart">
                  {memberAnalytics.pointsHistory?.map((data, index) => (
                    <div key={index} className="points-bar">
                      <div className="points-month">{data.month}</div>
                      <div 
                        className="points-bar-fill" 
                        style={{ height: `${Math.min(data.points * 2, 200)}px` }}
                      >
                        {data.points}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="clubs-list">
                <h3>My Clubs</h3>
                <ul>
                  {memberAnalytics.clubs?.map((club) => (
                    club ? <li key={club.id}>{club.name}</li> : null
                  ))}
                </ul>
              </div>

              <div className="recent-events">
                <h3>Recent Events Attended</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Club</th>
                      <th>Date</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberAnalytics.recentEvents?.map((event) => (
                      <tr key={event.id}>
                        <td>{event.title}</td>
                        <td>{event.Club?.name}</td>
                        <td>{new Date(event.date).toLocaleDateString()}</td>
                        <td>{event.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p>Loading your analytics...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;
