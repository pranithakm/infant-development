const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Correct way to list models in @google/generative-ai
    const result = await genAI.listModels();
    console.log('Available models:');
    result.models.forEach(m => {
        console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})`);
    });
  } catch (error) {
    console.error('List Models Error:', error.message);
  }
}

listModels();
