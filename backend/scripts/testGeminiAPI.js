const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGeminiAPI() {
  try {
    console.log('Testing Gemini API connection...');
    
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.log('GEMINI_API_KEY not found in environment variables');
      return;
    }
    
    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use the same model as in the controller
    console.log(`Trying model: gemini-flash-latest`);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
    
    // Test prompt similar to what we use in the controller
    const prompt = `
      You are an expert in infant development. Based on the following information about an infant, 
      provide personalized developmental insights and recommendations.
      
      Infant Information:
      Name: Test Baby
      Age: 6 months (180 days)
      Gender: male
      Birth Weight: 3.2 kg
      Birth Length: 50 cm
      Birth Head Circumference: 34 cm
      Current Weight: 7.5 kg
      Current Height: 65 cm
      Current Head Circumference: 42 cm
      
      Medical Information:
      Blood Type: Not provided
      Allergies: None reported
      Medications: None
      Conditions: None
      
      Milestone Progress:
      Smiling: Achieved
      Rolling over: Developing
      Sitting: Emerging
      
      Growth Data:
      No growth data available
      
      Available Milestones (10 total):
      Smiling (Social, 0-3 months): First social milestone
      Rolling over (Motor, 4-6 months): Physical development
      Sitting (Motor, 6-8 months): Core strength development
      
      Available Routines (5 total):
      Feeding (Nutrition): Regular feeding schedule
      Sleep (Rest): Consistent sleep routine
      
      Available Government Schemes (3 total):
      Nutrition Program (Health, National): Free nutrition support
      Vaccination Program (Health, National): Free vaccination services
      
      Please provide a response in STRICT JSON format with the following structure:
      {
        "development_summary": "Brief summary of overall development",
        "growth_analysis": "Analysis of growth patterns",
        "strengths": ["List of developmental strengths"],
        "possible_delays": ["List of possible developmental delays"],
        "recommended_upcoming_milestones": ["List of milestones to focus on next"],
        "routine_compliance": "Analysis of routine adherence",
        "suggested_routines": ["List of recommended routines"],
        "eligible_schemes": ["List of government schemes the family might benefit from"],
        "parenting_recommendations": ["List of parenting recommendations"]
      }
      
      Important instructions:
      1. Respond ONLY with valid JSON
      2. Do not include any explanations outside the JSON structure
      3. If information is not available, use empty strings or arrays
      4. Be concise but informative
      5. Use simple language that parents can easily understand
    `;
    
    console.log('Sending test prompt to Gemini API...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log(`Received response from gemini-flash-latest:`);
    console.log(text);
    
    // Try to parse as JSON
    try {
      let jsonString = text;
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.substring(7, jsonString.length - 3);
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.substring(3, jsonString.length - 3);
      }
      const parsed = JSON.parse(jsonString);
      console.log('Parsed JSON:');
      console.log(JSON.stringify(parsed, null, 2));
      console.log('Model test successful!');
    } catch (parseError) {
      console.log('Could not parse as JSON, but received response:');
      console.log(text);
    }
    
  } catch (error) {
    console.error('Error testing Gemini API:', error);
    console.error('Stack trace:', error.stack);
  }
}

testGeminiAPI();