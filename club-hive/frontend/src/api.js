// Assign user as club_head/president/secretary for a specific club (admin only)
export async function assignUserClubRole(userId, clubId, role, token) {
  const res = await fetch(`${API_BASE}/users/${userId}/club-role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ clubId, role })
  });
  if (!res.ok) throw new Error('Failed to assign club role');
  return res.json();
}
// List all users (admin only)
export async function getUsers(token) {
  const res = await fetch(`${API_BASE}/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

// Promote user to club head (admin only)
export async function promoteUser(userId, role, token) {
  const res = await fetch(`${API_BASE}/users/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ role })
  });
  if (!res.ok) throw new Error('Failed to promote user');
  return res.json();
}
// Fetch pending join requests for a club (admin/club head)
export async function getPendingMemberships(clubId, token) {
  const res = await fetch(`${API_BASE}/clubs/${clubId}/pending`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch pending requests');
  return res.json();
}

// Approve or reject a membership request
export async function updateMembershipStatus(clubId, userId, status, token) {
  const res = await fetch(`${API_BASE}/clubs/${clubId}/membership/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update membership');
  return res.json();
}
// Simple API utility for Club Hive frontend
const API_BASE = 'http://localhost:5001/api';

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function register(email, password, name) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });
  if (!res.ok) throw new Error('Registration failed');
  return res.json();
}

export async function getMe(token) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

export async function getClubs(token) {
  const res = await fetch(`${API_BASE}/clubs`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch clubs');
  return res.json();
}

export async function getEvents(token) {
  const res = await fetch(`${API_BASE}/events`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function getMyClubs(token) {
  const res = await fetch(`${API_BASE}/clubs/my-clubs`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch my clubs');
  return res.json();
}

export async function getLeaderboard(token) {
  const res = await fetch(`${API_BASE}/leaderboard`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}
