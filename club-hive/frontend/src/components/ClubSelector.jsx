import './ClubSelector.css';

export default function ClubSelector({ clubs, onSelect, onCancel, title }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content club-selector" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <div className="club-selector-list">
          {clubs.length === 0 ? (
            <p className="empty-message">No clubs available</p>
          ) : (
            clubs.map((club) => (
              <div 
                key={club.id} 
                className="club-selector-item"
                onClick={() => onSelect(club)}
              >
                <div className="club-selector-name">{club.name}</div>
                {club.description && (
                  <div className="club-selector-description">{club.description}</div>
                )}
              </div>
            ))
          )}
        </div>
        <button className="cancel-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
