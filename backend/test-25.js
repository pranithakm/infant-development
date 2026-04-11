const axios = require('axios');
require('dotenv').config();

async function testGemini25() {
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`;
  
  try {
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: "Hello, provide a short personalized greeting for a parent." }] }]
    });
    console.log('2.5 FLASH SUCCESS:', response.data.candidates[0].content.parts[0].text);
  } catch (err) {
    console.error('2.5 FLASH FAILED');
    if (err.response) {
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error:', err.message);
    }
  }
}

testGemini25();
