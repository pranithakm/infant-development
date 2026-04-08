const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listGeminiModels() {
  try {
    console.log('Testing basic Gemini API connection...');
    
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.log('GEMINI_API_KEY not found in environment variables');
      return;
    }
    
    // Make a direct API call to list models
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + process.env.GEMINI_API_KEY);
    
    if (!response.ok) {
      console.log(`HTTP Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('Error details:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Available models:');
    data.models.forEach(model => {
      console.log(`- ${model.name}: ${model.displayName || 'No display name'}`);
    });
  } catch (error) {
    console.error('Error listing Gemini models:', error);
    console.error('Stack trace:', error.stack);
  }
}

listGeminiModels();