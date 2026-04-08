// Test script to verify routine status update functionality
const mongoose = require('mongoose');
const Routine = require('../models/Routine');
const Infant = require('../models/Infant');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    try {
      // Get a sample infant and routine for testing
      const infant = await Infant.findOne({ isActive: true });
      const routine = await Routine.findOne({ isActive: true });
      
      if (!infant || !routine) {
        console.log('No infant or routine found for testing');
        process.exit(1);
      }
      
      console.log('Testing with infant:', infant.name);
      console.log('Testing with routine:', routine.name);
      
      // Test adding a routine to an infant for today's date
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      console.log('Testing date:', today);
      
      // Find if there's already an entry for today
      let dateEntryIndex = infant.routines.findIndex(entry => entry.date === today);
      
      if (dateEntryIndex === -1) {
        // Create new date entry
        infant.routines.push({
          date: today,
          routineIds: [routine._id]
        });
        console.log('Created new date entry for routine');
      } else {
        // Add routineId to existing date entry if not already present
        if (!infant.routines[dateEntryIndex].routineIds.includes(routine._id)) {
          infant.routines[dateEntryIndex].routineIds.push(routine._id);
          console.log('Added routine to existing date entry');
        } else {
          console.log('Routine already exists for this date');
        }
      }
      
      // Save the infant
      await infant.save();
      console.log('Infant updated successfully');
      
      // Verify the update
      const updatedInfant = await Infant.findById(infant._id);
      const updatedEntry = updatedInfant.routines.find(entry => entry.date === today);
      console.log('Updated entry:', updatedEntry);
      
      console.log('Test completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Test failed:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });