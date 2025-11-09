async function testRegisterAndLogin() {
  try {
    // Register a new user
    const registerRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student1@clubhive.local',
        password: 'Student@1234',
        name: 'Student One'
      })
    });
    const registerData = await registerRes.json();
    console.log('Register status:', registerRes.status);
    console.log('Register response:', registerData);

    // Login with the new user
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student1@clubhive.local',
        password: 'Student@1234'
      })
    });
    const loginData = await loginRes.json();
    console.log('Login status:', loginRes.status);
    console.log('Login response:', loginData);
  } catch (error) {
    console.error('Register/Login test failed:', error.message);
  }
}

testRegisterAndLogin();
