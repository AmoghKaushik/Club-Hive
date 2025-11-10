import { useState } from 'react';
import './Forms.css';

export default function EventForm({ clubId, clubName, token, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    date: '',
    time: '17:30', // Default 5:30 PM
    points: '10'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate required fields
    if (!formData.title.trim()) {
      setError('Event title is required');
      setLoading(false);
      return;
    }
    if (!formData.venue.trim()) {
      setError('Venue is required');
      setLoading(false);
      return;
    }
    if (!formData.date) {
      setError('Date is required');
      setLoading(false);
      return;
    }

    // Combine date and time - store as UTC to avoid timezone issues
    // We treat the input as the intended display time (not local time)
    const dateTime = `${formData.date}T${formData.time}:00.000Z`;

    try {
      const res = await fetch('http://localhost:5001/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          venue: formData.venue,
          date: dateTime,
          points: parseInt(formData.points) || 10,
          ClubId: clubId
        })
      });

      if (!res.ok) throw new Error('Failed to create event');
      
      alert('Event created successfully!');
      onSuccess();
    } catch (err) {
      setError(err.message || 'Could not create event');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Event for {clubName}</h3>
          <button className="close-button" onClick={onCancel}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body form-body">
          {error && <div className="error-box">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="title">Event Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Annual Tech Fest"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Event details..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="venue">Venue *</label>
            <input
              type="text"
              id="venue"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              placeholder="e.g., Auditorium A"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="time">Time *</label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="points">Points</label>
            <input
              type="number"
              id="points"
              name="points"
              value={formData.points}
              onChange={handleChange}
              min="0"
              max="100"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
