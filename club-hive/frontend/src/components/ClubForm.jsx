import { useState } from 'react';
import './Forms.css';

export default function ClubForm({ token, onSuccess, onCancel, editMode = false, initialData = null }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || ''
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
    if (!formData.name.trim()) {
      setError('Club name is required');
      setLoading(false);
      return;
    }

    try {
      const url = editMode 
        ? `http://localhost:5001/api/clubs/${initialData.id}`
        : 'http://localhost:5001/api/clubs';
      
      const res = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error(`Failed to ${editMode ? 'update' : 'create'} club`);
      
      alert(`Club ${editMode ? 'updated' : 'created'} successfully!`);
      onSuccess();
    } catch (err) {
      setError(err.message || `Could not ${editMode ? 'update' : 'create'} club`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editMode ? 'Edit Club' : 'Create New Club'}</h3>
          <button className="close-button" onClick={onCancel}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body form-body">
          {error && <div className="error-box">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="name">Club Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Computer Science Club"
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
              placeholder="Tell members about your club..."
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              <option value="Technical">Technical</option>
              <option value="Cultural">Cultural</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Club' : 'Create Club')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
