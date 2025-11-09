async function testMe(token) {
  try {
    const response = await fetch('http://localhost:5000/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('User info:', data);
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

// Paste your token here from the login test
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZhNjQxOGU2LTMzMDMtNGE4ZC05MzkwLWI5MjNkOGIxYTRhZiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2MjU5MTA0NiwiZXhwIjoxNzYyNjc3NDQ2fQ.b92y2DufNaVB9M3IEYpPKeUvvHBj51VERSiCEPdXzbw';
testMe(token);
