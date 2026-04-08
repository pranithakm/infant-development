const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Routine = require('../models/Routine');

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

// Test personalized routine creation
const testPersonalizedRoutine = async () => {
  try {
    await connectDB();
    
    // Create a personalized routine
    const routineData = {
      name: "Personalized Bedtime Routine",
      description: "A calming bedtime routine personalized for baby's specific needs",
      category: "personalized",
      duration: 30,
      isPersonalized: true,
      infantId: new mongoose.Types.ObjectId(), // This would be a real infant ID in practice
      isActive: true
    };
    
    const routine = await Routine.create(routineData);
    console.log('Personalized routine created successfully:');
    console.log(routine);
    
    // Fetch the routine
    const fetchedRoutine = await Routine.findById(routine._id);
    console.log('Fetched routine:');
    console.log(fetchedRoutine);
    
    // Clean up
    await Routine.findByIdAndDelete(routine._id);
    console.log('Test routine deleted');
    
  } catch (error) {
    console.error('Error testing personalized routine:', error);
  } finally {
    process.exit(0);
  }
};

testPersonalizedRoutine();