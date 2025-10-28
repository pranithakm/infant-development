require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    console.log('Testing Gemini API connection...');
    
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      return;
    }
    
    console.log('API Key length:', process.env.GEMINI_API_KEY.length);
    
    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try the gemini-1.5-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    
    // Test prompt
    const prompt = "Give me a very short response: What is 2+2?";
    
    console.log('Sending request to Gemini API...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini API Response:');
    console.log(text);
    console.log('\nGemini API connection successful!');
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    if (error.message.includes('API_KEY')) {
      console.error('Please check your GEMINI_API_KEY in the .env file');
    }
  }
}

testGemini();