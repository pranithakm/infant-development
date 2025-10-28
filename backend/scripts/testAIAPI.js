const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testAIAPI() {
  try {
    console.log('Testing AI API endpoints...\n');
    
    // Test health check
    const healthResponse = await axios.get(`${API_BASE_URL}/../health`);
    console.log('Health Check:', healthResponse.data);
    
    // Since we need authentication to access infant data, we'll just test that the endpoint exists
    // In a real scenario, you would need to authenticate first
    
    try {
      // Test AI insights endpoint (this should fail without auth)
      const aiResponse = await axios.post(`${API_BASE_URL}/ai/insights/test-id`);
      console.log('AI Insights Response:', aiResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('AI Insights endpoint exists (requires authentication)');
      } else {
        console.log('AI Insights endpoint error:', error.response?.data || error.message);
      }
    }
    
    try {
      // Test AI chat endpoint (this should fail without auth)
      const chatResponse = await axios.post(`${API_BASE_URL}/ai/chat/test-id`, { message: "Test" });
      console.log('AI Chat Response:', chatResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('AI Chat endpoint exists (requires authentication)');
      } else {
        console.log('AI Chat endpoint error:', error.response?.data || error.message);
      }
    }
    
    console.log('\nAI API tests completed!');
  } catch (error) {
    console.error('API Test Error:', error.response?.data || error.message);
  }
}

testAIAPI();