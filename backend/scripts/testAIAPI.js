const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { initializeAI, getAIInsights, regenerateInsights } = require('../controllers/aiController');

// Load environment variables
dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/1000steps', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Test AI integration
const testAIIntegration = async () => {
  try {
    // Initialize AI service
    await initializeAI();
    
    console.log('AI service initialized successfully');
    
    // Test with a sample infant ID (replace with a valid ID from your database)
    // const infantId = 'YOUR_INFANT_ID_HERE';
    // const mockReq = { params: { infantId } };
    // const mockRes = {
    //   status: (code) => {
    //     console.log(`Response status: ${code}`);
    //     return mockRes;
    //   },
    //   json: (data) => {
    //     console.log('Response data:', JSON.stringify(data, null, 2));
    //   }
    // };
    
    // // Test initial insights generation
    // console.log('Testing initial insights generation...');
    // await getAIInsights(mockReq, mockRes);
    
    // // Test insights regeneration
    // console.log('Testing insights regeneration...');
    // await regenerateInsights(mockReq, mockRes);
    
  } catch (error) {
    console.error('Error testing AI integration:', error);
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testAIIntegration();
  process.exit(0);
};

runTest();