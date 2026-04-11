const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Infant = require('../models/Infant');
const Growth = require('../models/Growth');
const Milestone = require('../models/Milestone');

async function seedDemo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Create Demo User
    let user = await User.findOne({ email: 'demo@infantdev.com' });
    if (!user) {
      user = new User({
        name: 'Demo Parent',
        email: 'demo@infantdev.com',
        password: 'demo123', // Will be hashed by pre-save hook
        role: 'parent',
        isVerified: true
      });
      await user.save();
      console.log('Demo user created: demo@infantdev.com / demo123');
    } else {
      console.log('Demo user already exists');
    }

    // 2. Create Demo Infant
    let infant = await Infant.findOne({ name: 'Arjun', 'parents.user': user._id });
    if (!infant) {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 1); // 1 year old
      
      infant = new Infant({
        name: 'Arjun',
        dateOfBirth: dob,
        gender: 'male',
        birthWeight: 3.2,
        birthLength: 50,
        birthHeadCircumference: 34,
        currentWeight: 10.5,
        currentHeight: 75,
        currentHeadCircumference: 46,
        parents: [{
          user: user._id,
          relationship: 'Father',
          isPrimary: true
        }],
        medicalInfo: {
          bloodType: 'O+',
          allergies: ['None'],
          pediatrician: {
            name: 'Dr. Smith',
            contact: '555-0123'
          }
        }
      });

      // 3. Add Milestones
      const milestones = await Milestone.find().limit(25);
      infant.milestones = milestones.map(m => ({
        milestoneId: m._id,
        status: 'Achieved'
      }));

      await infant.save();
      console.log('Demo infant created: Arjun');
    } else {
      console.log('Demo infant already exists');
    }

    // 4. Create Growth Data
    const growthCount = await Growth.countDocuments({ infant: infant._id });
    if (growthCount === 0) {
      const growthRecords = [];
      const startDate = new Date(infant.dateOfBirth);
      
      for (let i = 0; i <= 12; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);
        
        growthRecords.push({
          infant: infant._id,
          date: date,
          weight: 3.2 + (i * 0.6), // Simplified linear growth
          height: 50 + (i * 2),
          headCircumference: 34 + (i * 1)
        });
      }
      
      await Growth.insertMany(growthRecords);
      console.log('Seed: 13 growth records added for Arjun');
    } else {
      console.log('Growth records already exist for Arjun');
    }

    console.log('\n✨ Demo environment seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedDemo();
