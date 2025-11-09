async function testClubs(token) {
  // Create a club
  try {
    const createRes = await fetch('http://localhost:5000/api/clubs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Chess Club',
        description: 'A club for chess enthusiasts',
        facultyAdvisor: null
      })
    });
    const createData = await createRes.json();
    console.log('Create club status:', createRes.status);
    console.log('Create club response:', createData);

    // List clubs
    const listRes = await fetch('http://localhost:5000/api/clubs', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const listData = await listRes.json();
    console.log('List clubs status:', listRes.status);
    console.log('List clubs response:', listData);
  } catch (error) {
    console.error('Club test failed:', error.message);
  }
}

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZhNjQxOGU2LTMzMDMtNGE4ZC05MzkwLWI5MjNkOGIxYTRhZiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2MjU5MTA0NiwiZXhwIjoxNzYyNjc3NDQ2fQ.b92y2DufNaVB9M3IEYpPKeUvvHBj51VERSiCEPdXzbw';
testClubs(token);
