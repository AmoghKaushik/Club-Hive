async function testEvents(token, clubId) {
  try {
    // Create an event
    const createRes = await fetch('http://localhost:5000/api/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Chess Tournament',
        description: 'Annual chess tournament',
        venue: 'Main Hall',
        date: new Date().toISOString(),
        ClubId: clubId
      })
    });
    const createData = await createRes.json();
    console.log('Create event status:', createRes.status);
    console.log('Create event response:', createData);

    // List events
    const listRes = await fetch('http://localhost:5000/api/events', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const listData = await listRes.json();
    console.log('List events status:', listRes.status);
    console.log('List events response:', listData);
  } catch (error) {
    console.error('Event test failed:', error.message);
  }
}

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZhNjQxOGU2LTMzMDMtNGE4ZC05MzkwLWI5MjNkOGIxYTRhZiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2MjU5MTA0NiwiZXhwIjoxNzYyNjc3NDQ2fQ.b92y2DufNaVB9M3IEYpPKeUvvHBj51VERSiCEPdXzbw';
const clubId = '2ba59563-54cd-45bf-b363-a8ad025027e8';
testEvents(token, clubId);
