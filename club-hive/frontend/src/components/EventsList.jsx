import { useState, useEffect } from 'react';
import { getEvents } from '../api';
import './EventsList.css';

export default function EventsList({ token, user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'past', 'all'

  useEffect(() => {
    fetchEvents();
  }, [token]);

  async function fetchEvents() {
    setLoading(true);
    setError('');
    try {
      const data = await getEvents(token);
      setEvents(data);
    } catch (err) {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  async function handleRSVP(eventId) {
    setError('');
    try {
      const res = await fetch(`http://localhost:5001/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to RSVP');
      alert('RSVP successful! You will earn points upon attendance.');
      fetchEvents();
    } catch (err) {
      setError('Could not RSVP to event');
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
            
            return (
              <div key={event.id} className={`event-card ${!isUpcoming ? 'past-event' : ''}`}>
                <div className="event-status-badge">
                  {isUpcoming ? '📅 Upcoming' : '✓ Completed'}
                </div>
                <h3>{event.title}</h3>
                <p className="event-description">{event.description || 'No description'}</p>
                
                <div className="event-details">
                  <div className="event-detail-item">
                    <span className="detail-icon">📍</span>
                    <span>{event.venue}</span>
                  </div>
                  <div className="event-detail-item">
                    <span className="detail-icon">🕐</span>
                    <span>{eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  {event.Club && (
                    <div className="event-detail-item">
                      <span className="detail-icon">🏛️</span>
                      <span>{event.Club.name}</span>
                    </div>
                  )}
                  <div className="event-detail-item">
                    <span className="detail-icon">⭐</span>
                    <span>{event.points || 10} points</span>
                  </div>
                </div>

                {isUpcoming && user?.role === 'member' && (
                  <button 
                    className="rsvp-button"
                    onClick={() => handleRSVP(event.id)}
                  >
                    RSVP Now
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
