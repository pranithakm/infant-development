const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from the same directory
dotenv.config();

async function testGemini() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY NOT FOUND IN .ENV');
      return;
    }
    console.log('Using API Key starts with:', apiKey.substring(0, 8));
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello, respond with 'Success' if you can read this.");
    const response = await result.response;
    console.log('Gemini Result:', response.text());
  } catch (error) {
    console.error('Gemini Test Error:', error.message);
    if (error.stack) console.error(error.stack);
  }
}

testGemini();
