import { useState, useEffect } from 'react';
import { getEvents, registerForEvent, unregisterFromEvent, getEventParticipants, checkMyRegistration, markAttendance } from '../api';
import './EventsList.css';

export default function EventsList({ token, user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'past', 'all'
  const [registrations, setRegistrations] = useState({}); // eventId -> { registered: boolean, count: number }
  const [viewingParticipants, setViewingParticipants] = useState(null); // eventId for modal
  const [participantsData, setParticipantsData] = useState({}); // eventId -> participants array

  const isAdmin = user?.role === 'admin';
  const isBoardMember = (clubId) => {
    // Check if user is a board member of this specific club
    // This would need to be passed from parent or fetched
    // For now, we'll try to fetch participants to determine access
    return false;
  };

  useEffect(() => {
    fetchEvents();
  }, [token]);

  async function fetchEvents() {
    setLoading(true);
    setError('');
    try {
      const data = await getEvents(token);
      setEvents(data);
      
      // Fetch registration status and participants for each event
      const regStatus = {};
      const participantsMap = {};
      
      for (const event of data) {
        // Check user's own registration status
        try {
          const myReg = await checkMyRegistration(event.id, token);
          regStatus[event.id] = {
            registered: myReg.registered,
            count: 0,
            canManage: false
          };
        } catch (err) {
          console.log('Could not check registration for event', event.id);
          regStatus[event.id] = {
            registered: false,
            count: 0,
            canManage: false
          };
        }
        
        // Try to fetch participants (only succeeds for admin/board members)
        try {
          const participants = await getEventParticipants(event.id, token);
          participantsMap[event.id] = participants;
          regStatus[event.id].count = participants.length;
          regStatus[event.id].canManage = true; // If we can fetch, we can manage
        } catch (err) {
          // Not authorized to view participants - that's fine for regular members
          participantsMap[event.id] = [];
          regStatus[event.id].canManage = false; // Explicitly set to false
        }
      }
      
      setRegistrations(regStatus);
      setParticipantsData(participantsMap);
    } catch (err) {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(eventId) {
    setError('');
    try {
      await registerForEvent(eventId, token);
      alert('Successfully registered for event!');
      fetchEvents(); // Refresh to update registration status
    } catch (err) {
      setError(err.message || 'Could not register for event');
    }
  }

  async function handleUnregister(eventId) {
    setError('');
    if (!confirm('Are you sure you want to unregister from this event?')) return;
    
    try {
      await unregisterFromEvent(eventId, token);
      alert('Successfully unregistered from event');
      fetchEvents(); // Refresh to update registration status
    } catch (err) {
      setError(err.message || 'Could not unregister from event');
    }
  }

  async function openParticipantsModal(eventId) {
    setViewingParticipants(eventId);
  }

  async function handleMarkAttendance(eventId, userId, status) {
    setError('');
    try {
      await markAttendance(eventId, userId, status, token);
      // Refresh participants list
      const data = await getEventParticipants(eventId, token);
      setParticipantsData(prev => ({ ...prev, [eventId]: data }));
      alert(`Attendance marked as ${status}!`);
    } catch (err) {
      setError(err.message || 'Failed to mark attendance');
      alert('Error: ' + (err.message || 'Failed to mark attendance'));
    }
  }

  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.date) >= now);
  const pastEvents = events.filter(e => new Date(e.date) < now);

  const displayEvents = filter === 'upcoming' ? upcomingEvents : 
                       filter === 'past' ? pastEvents : events;

  if (loading) return <div className="loading">Loading events...</div>;

  return (
    <div className="events-container">
      <div className="events-header">
        <h2>Events</h2>
        <div className="filter-buttons">
          <button 
            className={filter === 'upcoming' ? 'active' : ''}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming ({upcomingEvents.length})
          </button>
          <button 
            className={filter === 'past' ? 'active' : ''}
            onClick={() => setFilter('past')}
          >
            Past ({pastEvents.length})
          </button>
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All ({events.length})
          </button>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {displayEvents.length === 0 ? (
        <div className="empty-state">
          <p>No {filter} events found.</p>
        </div>
      ) : (
        <div className="events-grid">
          {displayEvents.map((event) => {
            const eventDate = new Date(event.date);
            const isUpcoming = eventDate >= now;
            const regInfo = registrations[event.id] || { registered: false, count: 0, canManage: false };
            
            return (
              <div key={event.id} className={`event-card ${!isUpcoming ? 'past-event' : ''}`}>
                <div className="event-status-badge">
                  {isUpcoming ? '📅 Upcoming' : '✓ Completed'}
                </div>
                {regInfo.registered && (
                  <div className="registration-badge">✓ Registered</div>
                )}
                <h3>{event.title}</h3>
                <p className="event-description">{event.description || 'No description'}</p>
                
                <div className="event-details">
                  <div className="event-detail-item">
                    <span className="detail-icon">📍</span>
                    <span>{event.venue}</span>
                  </div>
                  <div className="event-detail-item">
                    <span className="detail-icon">🕐</span>
                    <span>{eventDate.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric', 
                      timeZone: 'UTC' 
                    })} at {eventDate.toLocaleTimeString('en-US', {
                      hour: '2-digit', 
                      minute: '2-digit',
                      timeZone: 'UTC'
                    })}</span>
                  </div>
                  {event.Club && (
                    <div className="event-detail-item">
                      <span className="detail-icon">🏛️</span>
                      <span>{event.Club.name}</span>
                    </div>
                  )}
                  {regInfo.canManage && (
                    <div className="event-detail-item">
                      <span className="detail-icon">👥</span>
                      <span>{regInfo.count} registered</span>
                    </div>
                  )}
                  <div className="event-detail-item">
                    <span className="detail-icon">⭐</span>
                    <span>{event.points || 10} points</span>
                  </div>
                </div>

                {isUpcoming && (
                  <div className="event-actions">
                    {regInfo.canManage ? (
                      // Board members and admins see "View Registrations" button
                      <button 
                        className="view-registrations-button"
                        onClick={() => openParticipantsModal(event.id)}
                      >
                        View Registrations ({regInfo.count})
                      </button>
                    ) : (
                      // Regular members see Register/Unregister buttons
                      <>
                        {regInfo.registered ? (
                          <button 
                            className="unregister-button"
                            onClick={() => handleUnregister(event.id)}
                          >
                            Unregister
                          </button>
                        ) : (
                          <button 
                            className="register-button"
                            onClick={() => handleRegister(event.id)}
                          >
                            Register
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Participants Modal */}
      {viewingParticipants && (
        <div className="modal-backdrop" onClick={() => setViewingParticipants(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Event Registrations</h3>
              <button className="close-button" onClick={() => setViewingParticipants(null)}>✕</button>
            </div>
            <div className="modal-body">
              {participantsData[viewingParticipants]?.length > 0 ? (
                <div className="participants-list">
                  {participantsData[viewingParticipants].map((p) => (
                    <div key={p.id} className="participant-item">
                      <div className="participant-info">
                        <span className="participant-name">{p.User?.name || 'Unknown'}</span>
                        <span className="participant-email">{p.User?.email || ''}</span>
                      </div>
                      <div className="participant-actions">
                        <span className={`status-badge status-${p.status}`}>
                          {p.status === 'registered' ? '📝 Registered' : 
                           p.status === 'attended' ? '✓ Attended' : '✗ Absent'}
                        </span>
                        {(isAdmin || registrations[viewingParticipants]?.canManage) && (
                          <div className="attendance-buttons">
                            <button 
                              className="btn-attended"
                              onClick={() => handleMarkAttendance(viewingParticipants, p.UserId, 'attended')}
                              disabled={p.status === 'attended'}
                            >
                              ✓ Present
                            </button>
                            <button 
                              className="btn-absent"
                              onClick={() => handleMarkAttendance(viewingParticipants, p.UserId, 'absent')}
                              disabled={p.status === 'absent'}
                            >
                              ✗ Absent
                            </button>
                            <button 
                              className="btn-clear"
                              onClick={() => handleMarkAttendance(viewingParticipants, p.UserId, 'registered')}
                              disabled={p.status === 'registered'}
                            >
                              ↺ Clear
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No registrations yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
