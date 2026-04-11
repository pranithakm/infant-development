const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

async function testGemini() {
  console.log('--- Testing Gemini ---');
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error('No Gemini Key found');
    return;
  }
  console.log('Key:', key.substring(0, 5) + '...');
  
  const models = ['gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-1.5-flash-latest'];
  
  for (const modelName of models) {
    try {
      console.log(`Testing model: ${modelName}`);
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hi');
      console.log(`Success with ${modelName}:`, result.response.text());
      return;
    } catch (err) {
      console.error(`Failed ${modelName}:`, err.message);
    }
  }
}

async function testOpenAI() {
  console.log('\n--- Testing OpenAI ---');
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error('No OpenAI Key found');
    return;
  }
  
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hi' }]
    }, {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    console.log('Success with OpenAI:', response.data.choices[0].message.content);
  } catch (err) {
    console.error('Failed OpenAI:', err.response?.data?.error?.message || err.message);
  }
}

async function run() {
  await testGemini();
  await testOpenAI();
}

run();
