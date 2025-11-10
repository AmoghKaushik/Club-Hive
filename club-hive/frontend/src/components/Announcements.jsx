import { useState, useEffect } from 'react';
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '../api';
import { getMyClubs, getClubs } from '../api';
import './Announcements.css';

export default function Announcements({ token, user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [myClubs, setMyClubs] = useState([]);
  const [allClubs, setAllClubs] = useState([]); // For admins to see all clubs
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    clubId: ''
  });

  useEffect(() => {
    console.log('Announcements component mounted!');
    fetchAnnouncements();
    fetchMyClubs(); // Always fetch clubs to check board membership
    if (user.role === 'admin') {
      fetchAllClubs(); // Admins need to see all clubs for posting
    }
  }, [token]);

  async function fetchAnnouncements() {
    try {
      setLoading(true);
      const data = await getAnnouncements(token);
      setAnnouncements(data);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMyClubs() {
    try {
      const memberships = await getMyClubs(token);
      // getMyClubs returns memberships with Club nested inside, not clubs with ClubMembership
      console.log('Fetched memberships:', memberships);
      console.log('User role:', user.role);
      setMyClubs(memberships);
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
    }
  }

  async function fetchAllClubs() {
    try {
      const clubs = await getClubs(token);
      console.log('Fetched all clubs for admin:', clubs);
      setAllClubs(clubs);
    } catch (error) {
      console.error('Failed to fetch all clubs:', error);
    }
  }

  function canPostAnnouncements() {
    // Check if user is admin or board member of any club
    // myClubs is actually an array of memberships, each with role property
    const canPost = user.role === 'admin' || myClubs.some(membership => membership.role === 'board');
    console.log('Can post announcements?', canPost);
    console.log('My clubs:', myClubs);
    console.log('Board memberships:', myClubs.filter(m => m.role === 'board'));
    return canPost;
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const clubId = formData.clubId === 'global' ? null : formData.clubId || null;
      await createAnnouncement(formData.title, formData.content, clubId, token);
      setShowForm(false);
      setFormData({ title: '', content: '', clubId: '' });
      fetchAnnouncements();
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleDelete(announcementId) {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await deleteAnnouncement(announcementId, token);
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    } catch (error) {
      alert(error.message);
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const canPost = user.role === 'admin' || myClubs.some(membership => membership.role === 'board');
  
  console.log('=== ANNOUNCEMENT RENDER ===');
  console.log('User:', user);
  console.log('MyClubs:', myClubs);
  console.log('canPost:', canPost);

  return (
    <div className="announcements-page">
      <div className="announcements-header">
        <h2>📢 Announcements</h2>
        {canPost && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-create-announcement"
          >
            {showForm ? 'Cancel' : '+ New Announcement'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="announcement-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Announcement title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Write your announcement..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="clubId">Audience</label>
            <select
              id="clubId"
              name="clubId"
              value={formData.clubId}
              onChange={handleChange}
            >
              <option value="">Select...</option>
              {user.role === 'admin' && (
                <option value="global">🌐 All Users (Global)</option>
              )}
              {user.role === 'admin' 
                ? allClubs.map(club => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))
                : myClubs
                    .filter(membership => membership.role === 'board')
                    .map(membership => (
                      <option key={membership.Club.id} value={membership.Club.id}>
                        {membership.Club.name}
                      </option>
                    ))
              }
            </select>
            <small className="form-hint">
              Leave blank or select a club to target specific audience
            </small>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setShowForm(false)} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Post Announcement
            </button>
          </div>
        </form>
      )}

      <div className="announcements-list">
        {loading ? (
          <div className="loading">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="empty-state">
            <p>No announcements yet</p>
          </div>
        ) : (
          announcements.map(announcement => (
            <div key={announcement.id} className="announcement-card">
              <div className="announcement-header-row">
                <div className="announcement-meta">
                  {announcement.club ? (
                    <span className="club-badge">{announcement.club.name}</span>
                  ) : (
                    <span className="global-badge">🌐 Global</span>
                  )}
                  <span className="author">by {announcement.author.name}</span>
                  <span className="date">{formatDate(announcement.createdAt)}</span>
                </div>
                {(announcement.createdBy === user.id || user.role === 'admin') && (
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="btn-delete"
                    title="Delete announcement"
                  >
                    ✕
                  </button>
                )}
              </div>
              <h3 className="announcement-title">{announcement.title}</h3>
              <p className="announcement-content">{announcement.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
