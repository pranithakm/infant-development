const mongoose = require('mongoose');
const Routine = require('../models/Routine');
require('dotenv').config();

// Default routines data
const defaultRoutines = [
  {
    name: 'Morning Feed',
    description: 'First feed of the day',
    category: 'feeding',
    recommendedFrequency: 'daily'
  },
  {
    name: 'Afternoon Feed',
    description: 'Midday feeding session',
    category: 'feeding',
    recommendedFrequency: 'daily'
  },
  {
    name: 'Evening Feed',
    description: 'Evening feeding session',
    category: 'feeding',
    recommendedFrequency: 'daily'
  },
  {
    name: 'Night Feed',
    description: 'Last feed before bedtime',
    category: 'feeding',
    recommendedFrequency: 'daily'
  },
  {
    name: 'Morning Nap',
    description: 'First nap of the day',
    category: 'sleep',
    recommendedFrequency: 'daily'
  },
  {
    name: 'Afternoon Nap',
    description: 'Midday nap',
    category: 'sleep',
    recommendedFrequency: 'daily'
  },
  {
    name: 'Bath Time',
    description: 'Daily hygiene routine',
    category: 'hygiene',
    recommendedFrequency: 'daily'
  },
  {
    name: 'Tummy Time',
    description: 'Tummy time exercise for development',
    category: 'development',
    recommendedFrequency: 'daily'
  },
  {
    name: 'Play Time',
    description: 'Interactive play session',
    category: 'play',
    recommendedFrequency: 'daily'
  },
  {
    name: 'Diaper Change',
    description: 'Regular diaper change',
    category: 'hygiene',
    recommendedFrequency: 'as_needed'
  }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    try {
      // Clear existing routines
      await Routine.deleteMany({});
      console.log('Cleared existing routines');
      
      // Insert default routines
      const insertedRoutines = await Routine.insertMany(defaultRoutines);
      console.log(`Inserted ${insertedRoutines.length} default routines`);
      
      // Display inserted routines
      insertedRoutines.forEach(routine => {
        console.log(`- ${routine.name} (${routine.category})`);
      });
      
      console.log('Routines initialization completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error initializing routines:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });