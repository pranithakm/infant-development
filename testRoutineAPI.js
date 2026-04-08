const axios = require('axios');

// Test the routine update API
async function testRoutineUpdate() {
  try {
    // Replace these with actual values from your database
    const infantId = 'YOUR_INFANT_ID';  // Replace with actual infant ID
    const routineId = 'YOUR_ROUTINE_ID';  // Replace with actual routine ID
    const date = '2025-10-28';  // Today's date
    const token = 'YOUR_JWT_TOKEN';  // Replace with actual JWT token
    
    console.log('Testing routine update API with:');
    console.log('- Infant ID:', infantId);
    console.log('- Routine ID:', routineId);
    console.log('- Date:', date);
    
    // Test completing a routine
    console.log('\\n--- Testing Routine Completion ---');
    const completeResponse = await axios.put(
      `http://localhost:5001/api/routines/infants/${infantId}/date/${date}/routine/${routineId}`,
      { completed: true },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Complete routine response:', completeResponse.data);
    
    // Test unchecking a routine
    console.log('\\n--- Testing Routine Uncheck ---');
    const uncheckResponse = await axios.put(
      `http://localhost:5001/api/routines/infants/${infantId}/date/${date}/routine/${routineId}`,
      { completed: false },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Uncheck routine response:', uncheckResponse.data);
    
    console.log('\\n--- Test completed successfully ---');
  } catch (error) {
    console.error('Test error:', error.response ? error.response.data : error.message);
  }
}

testRoutineUpdate();