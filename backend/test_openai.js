const axios = require('axios');
const dotenv = require('dotenv');
// Load from current directory if exists, else one level up
dotenv.config();

async function testOpenAI() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('OPENAI_API_KEY NOT FOUND IN .ENV');
        return;
    }
    console.log('Testing OpenAI Key:', apiKey.substring(0, 7) + '...');
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [{role: "user", content: "Say success"}]
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('OpenAI Result:', response.data.choices[0].message.content);
  } catch (error) {
    if (error.response) {
        console.error('OpenAI Test Error (Status):', error.response.status);
        console.error('OpenAI Test Error (Data):', error.response.data);
    } else {
        console.error('OpenAI Test Error:', error.message);
    }
  }
}

testOpenAI();
