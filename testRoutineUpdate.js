const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

const Infant = require('./backend/models/Infant');
const Routine = require('./backend/models/Routine');

// Simple test to verify routine update functionality
const axios = require('axios');

async function testRoutineUpdate() {
  try {
    // Replace with actual values from your setup
    const infantId = '671f0a85141555c9a713d13d'; // Replace with actual infant ID
    const routineId = '671f2d8a0fdf13ac0a4fc4c8'; // Replace with actual routine ID
    const date = '2025-10-28'; // Today's date
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MWYwYTgxMTQxNTU1YzlhNzEzZDEzZiIsImlhdCI6MTczMDExODA4NSwiZXhwIjoxNzMwNzIyODg1fQ.Xj54u9uQJ8gkZQ8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8'; // Replace with actual JWT token
    
    console.log('Testing routine update with:');
    console.log('- Infant ID:', infantId);
    console.log('- Routine ID:', routineId);
    console.log('- Date:', date);
    
    // Test completing a routine
    console.log('\n--- Testing Routine Completion ---');
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
    
    console.log('Complete routine response status:', completeResponse.status);
    console.log('Complete routine response data:', completeResponse.data);
    
    // Test unchecking a routine
    console.log('\n--- Testing Routine Uncheck ---');
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
    
    console.log('Uncheck routine response status:', uncheckResponse.status);
    console.log('Uncheck routine response data:', uncheckResponse.data);
    
    console.log('\n--- Test completed ---');
  } catch (error) {
    console.error('Test error:', error.response ? error.response.data : error.message);
  }
}

testRoutineUpdate();