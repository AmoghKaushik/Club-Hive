import { useState, useEffect } from 'react';
import { getLeaderboard } from '../api';
import './Leaderboard.css';

export default function Leaderboard({ token, user }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, [token]);

  async function fetchLeaderboard() {
    setLoading(true);
    setError('');
    try {
      const data = await getLeaderboard(token);
      setLeaderboard(data);
    } catch (err) {
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }

  const userRank = leaderboard.findIndex(u => u.id === user?.id) + 1;
  const userPoints = user?.points || 0;

  if (loading) return <div className="loading">Loading leaderboard...</div>;

  return (
    <div className="leaderboard-container">
      <h2>🏆 Leaderboard</h2>
      {error && <div className="error-box">{error}</div>}

      {user && (
        <div className="user-stats">
          <div className="stat-card">
            <div className="stat-label">Your Rank</div>
            <div className="stat-value">{userRank > 0 ? `#${userRank}` : 'N/A'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Your Points</div>
            <div className="stat-value">{userPoints}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Top 10</div>
            <div className="stat-value">{leaderboard.length >= 10 ? '✓' : leaderboard.length}</div>
          </div>
        </div>
      )}

      {leaderboard.length === 0 ? (
        <div className="empty-state">
          <p>No rankings yet. Attend events to earn points!</p>
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.map((entry, index) => {
            const isCurrentUser = entry.id === user?.id;
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            
            return (
              <div 
                key={entry.id} 
                className={`leaderboard-item ${isCurrentUser ? 'current-user' : ''} ${index < 3 ? 'top-three' : ''}`}
              >
                <div className="rank-section">
                  <span className="rank-number">{medal || `#${index + 1}`}</span>
                </div>
                <div className="user-section">
                  <div className="user-avatar">
                    {entry.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <div className="user-name">
                      {entry.name}
                      {isCurrentUser && <span className="you-badge">You</span>}
                    </div>
                    <div className="user-email">{entry.email}</div>
                  </div>
                </div>
                <div className="points-section">
                  <span className="points-value">{entry.points}</span>
                  <span className="points-label">points</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
