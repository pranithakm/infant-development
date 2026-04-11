const axios = require('axios');
require('dotenv').config();

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  
  try {
    const response = await axios.get(url);
    console.log('MODELS:', JSON.stringify(response.data.models.map(m => m.name), null, 2));
  } catch (err) {
    console.error('LIST MODELS FAILED');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error:', err.message);
    }
  }
}

listModels();
