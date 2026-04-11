const axios = require('axios');
require('dotenv').config();

async function testGeminiRest() {
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  
  try {
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: "Hi" }] }]
    });
    console.log('REST SUCCESS:', JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error('REST FAILED');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error:', err.message);
    }
  }
}

testGeminiRest();
