const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: 'backend/.env' });

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello, respond with 'Success'");
    const response = await result.response;
    console.log('Gemini Result:', response.text());
  } catch (error) {
    console.error('Gemini Test Error:', error.message);
  }
}

testGemini();
