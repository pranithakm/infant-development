const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

const Infant = require('./models/Infant');
const Routine = require('./models/Routine');

async function testFix() {
  try {
    console.log('Testing ObjectId handling fix...');
    
    // Get a sample infant and routine
    const infant = await Infant.findOne();
    const routine = await Routine.findOne();
    
    if (!infant || !routine) {
      console.log('No infant or routine found in database');
      return;
    }
    
    console.log('Testing with infant:', infant._id);
    console.log('Testing with routine:', routine._id);
    
    // Test adding routine to infant
    const date = '2025-10-28';
    let dateEntryIndex = infant.routines.findIndex(entry => entry.date === date);
    
    if (dateEntryIndex === -1) {
      // Create new date entry with proper ObjectId
      infant.routines.push({
        date: date,
        routineIds: [new mongoose.Types.ObjectId(routine._id)]
      });
      console.log('Added new date entry with routine');
    } else {
      // Add routineId to existing date entry if not already present
      const routineObjectId = new mongoose.Types.ObjectId(routine._id);
      const exists = infant.routines[dateEntryIndex].routineIds.some(id => 
        id.toString() === routineObjectId.toString());
      
      if (!exists) {
        infant.routines[dateEntryIndex].routineIds.push(routineObjectId);
        console.log('Added routine to existing date entry');
      } else {
        console.log('Routine already exists in date entry');
      }
    }
    
    // Save the infant
    await infant.save();
    console.log('Infant saved successfully');
    
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testFix();