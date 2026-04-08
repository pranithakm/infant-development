// Script to initialize schemes data in MongoDB
const { MongoClient } = require('mongodb');
require('dotenv').config();

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/1000steps';

// Sample schemes data
const schemes = [
  {
    name: "Janani Suraksha Yojana (JSY)",
    stateScope: "Nationwide",
    type: "Cash Transfer",
    eligibility: "BPL, SC/ST (All States). Age 19+ for BPL (LPA states), All ages for SC…",
    objective: "Encourage institutional deliveries.",
    benefits: "Cash incentive (amount varies by state/area classification).",
    description: "Cash for low-income/SC/ST women delivering in govt hospitals.",
    officialLink: "nhm.gov.in"
  },
  {
    name: "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
    stateScope: "Nationwide",
    type: "Cash Transfer",
    eligibility: "First live birth, age 19+ (except SC/ST), pregnant women excluding those in regular employment.",
    objective: "Provide partial compensation for wage loss to pregnant women.",
    benefits: "Rs. 5000/- in three installments for first live birth.",
    description: "Direct cash transfer to pregnant women for wage compensation during childbirth and childcare.",
    officialLink: "pmmvy.gov.in"
  },
  {
    name: "Indira Gandhi Matritva Sahyog Yojana (IGMSY)",
    stateScope: "Selected States",
    type: "Cash Transfer",
    eligibility: "Pregnant women aged 19+ (except SC/ST), first two live births, not in regular employment.",
    objective: "Provide nutritious diet to pregnant/lactating mothers.",
    benefits: "Monthly cash assistance for 6 months during pregnancy and lactation period.",
    description: "Nutritional support for pregnant and lactating mothers to improve maternal and child health.",
    officialLink: "wcd.nic.in"
  }
];

async function initializeSchemes() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected successfully to MongoDB');
    
    const db = client.db('1000steps');
    const collection = db.collection('schemes');
    
    // Check if schemes already exist
    const existingSchemes = await collection.countDocuments();
    
    if (existingSchemes > 0) {
      console.log(`⚠️  Database already contains ${existingSchemes} schemes. Skipping initialization.`);
      await client.close();
      process.exit(0);
    }

    // Insert schemes
    const result = await collection.insertMany(schemes);
    
    console.log(`🎉 Successfully initialized database with ${result.insertedCount} schemes!`);
    
    console.log('\n✨ Schemes initialization complete!');
    console.log('You can now start the FirstSteps application.');
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing schemes database:', error);
    if (client) {
      await client.close();
    }
    process.exit(1);
  }
}

// Run the initialization
console.log('FirstSteps Schemes Database Initialization Script');
console.log('===============================================');
console.log('This script will initialize your MongoDB database with government schemes data.');
console.log('');
initializeSchemes();