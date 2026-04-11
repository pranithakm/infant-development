const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

async function testGeminiPro() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Hello from FirstSteps!");
    const response = await result.response;
    console.log('Gemini Pro Result:', response.text());
  } catch (error) {
    console.error('Gemini Pro Error:', error.message);
  }
}

testGeminiPro();
