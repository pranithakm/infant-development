const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testAPI() {
  try {
    console.log('Testing API endpoints...\n');
    
    // Test health check
    const healthResponse = await axios.get(`${API_BASE_URL}/../health`);
    console.log('Health Check:', healthResponse.data);
    
    // Test get milestones
    const milestonesResponse = await axios.get(`${API_BASE_URL}/milestones`);
    console.log('Milestones Count:', milestonesResponse.data.count);
    
    console.log('\nAPI tests completed successfully!');
  } catch (error) {
    console.error('API Test Error:', error.response?.data || error.message);
  }
}

testAPI();