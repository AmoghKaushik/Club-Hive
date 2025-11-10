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

// Get user's club memberships (admin only)
export async function getUserMemberships(userId, token) {
  const res = await fetch(`${API_BASE}/users/${userId}/memberships`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch user memberships');
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

// Get club members
export async function getClubMembers(clubId, token) {
  const res = await fetch(`${API_BASE}/clubs/${clubId}/members`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch club members');
  return res.json();
}

// Update member role in club
export async function updateMemberRole(clubId, userId, role, roleName, token) {
  const res = await fetch(`${API_BASE}/clubs/${clubId}/members/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ role, roleName })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to update role');
  }
  return res.json();
}

// Remove member from club
export async function removeMemberFromClub(clubId, userId, token) {
  const res = await fetch(`${API_BASE}/clubs/${clubId}/members/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to remove member');
  return res.json();
}

// Update club (admin only)
export async function updateClub(clubId, name, description, token) {
  const res = await fetch(`${API_BASE}/clubs/${clubId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name, description })
  });
  if (!res.ok) throw new Error('Failed to update club');
  return res.json();
}

// Delete club (admin only)
export async function deleteClub(clubId, token) {
  const res = await fetch(`${API_BASE}/clubs/${clubId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete club');
  return res.json();
}

// Register for an event
export async function registerForEvent(eventId, token) {
  const res = await fetch(`${API_BASE}/events/${eventId}/register`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to register for event');
  }
  return res.json();
}

// Unregister from an event
export async function unregisterFromEvent(eventId, token) {
  const res = await fetch(`${API_BASE}/events/${eventId}/register`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to unregister from event');
  }
  return res.json();
}

// Get event participants (for board members/admin)
export async function getEventParticipants(eventId, token) {
  const res = await fetch(`${API_BASE}/events/${eventId}/participants`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch participants');
  return res.json();
}

// Check if current user is registered for an event
export async function checkMyRegistration(eventId, token) {
  const res = await fetch(`${API_BASE}/events/${eventId}/my-registration`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to check registration status');
  return res.json();
}

// Mark attendance for event participant (board members/admin)
export async function markAttendance(eventId, userId, status, token) {
  const res = await fetch(`${API_BASE}/events/${eventId}/attendance`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ userId, status })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to mark attendance');
  }
  return res.json();
}
