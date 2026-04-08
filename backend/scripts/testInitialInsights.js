const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Infant = require('../models/Infant');
const { initializeAI, getAIInsights } = require('../controllers/aiController');

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

// Test initial insights generation
const testInitialInsights = async () => {
  try {
    // Initialize AI service
    await initializeAI();
    
    console.log('AI service initialized successfully');
    
    // Find an infant without insights
    const infant = await Infant.findOne({ 
      $or: [
        { insights: { $exists: false } },
        { insights: { $eq: null } },
        { insights: { $eq: {} } }
      ]
    }).populate('milestones.milestoneId').populate('parents.user', 'name email');
    
    if (!infant) {
      console.log('No infant found without insights');
      return;
    }
    
    console.log(`Testing initial insights generation for infant: ${infant.name}`);
    
    // Mock request and response objects
    const mockReq = { params: { infantId: infant._id.toString() } };
    
    // We'll capture the response data
    let responseData = null;
    const mockRes = {
      status: (code) => {
        console.log(`Response status: ${code}`);
        return mockRes;
      },
      json: (data) => {
        responseData = data;
        console.log('Response data received');
      }
    };
    
    // Test initial insights generation
    console.log('Testing initial insights generation...');
    await getAIInsights(mockReq, mockRes);
    
    if (responseData && responseData.success) {
      console.log('Initial insights generated successfully:');
      console.log(JSON.stringify(responseData.data.insights, null, 2));
    } else {
      console.log('Failed to generate initial insights:');
      console.log(responseData);
    }
    
  } catch (error) {
    console.error('Error testing initial insights generation:', error);
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testInitialInsights();
  process.exit(0);
};

runTest();