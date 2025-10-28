// Standalone MongoDB initialization script for FirstSteps
// No npm install required - just run: node init-db.js

// Configuration - Modify this to match your MongoDB setup
const MONGODB_URI = 'mongodb://localhost:27017/1000steps';

// MongoDB driver (built into Node.js)
const { MongoClient } = require('mongodb');

// New milestone data based on provided information
const newMilestones = [
  // 1-2 months
  {
    name: 'Focuses on Face',
    description: 'Stares at your face when you are close',
    category: 'Cognitive',
    minMonths: 1,
    maxMonths: 2,
    recommendedAge: '1-2 months'
  },
  {
    name: 'Follows with Eyes',
    description: 'Follows things with eyes especially faces',
    category: 'Cognitive',
    minMonths: 1,
    maxMonths: 2,
    recommendedAge: '1-2 months'
  },
  {
    name: 'Reacts to Loud Sounds',
    description: 'Startles or reacts to loud sounds',
    category: 'Cognitive',
    minMonths: 1,
    maxMonths: 2,
    recommendedAge: '1-2 months'
  },
  {
    name: 'Lifts Head Briefly',
    description: 'Lifts head for a few seconds when on tummy',
    category: 'Physical',
    minMonths: 1,
    maxMonths: 2,
    recommendedAge: '1-2 months'
  },
  {
    name: 'Rooting Reflex',
    description: 'Turns head and opens mouth when cheek is stroked',
    category: 'Physical',
    minMonths: 1,
    maxMonths: 2,
    recommendedAge: '1-2 months'
  },
  
  // 2-3 months
  {
    name: 'Social Smile',
    description: 'Smiles back at you when you smile at them',
    category: 'Social-Emotional',
    minMonths: 2,
    maxMonths: 3,
    recommendedAge: '2-3 months'
  },
  {
    name: 'Cooing',
    description: 'Makes gurgling or cooing sounds',
    category: 'Language',
    minMonths: 2,
    maxMonths: 3,
    recommendedAge: '2-3 months'
  },
  {
    name: 'Turns to Sound',
    description: 'Turns head toward sounds',
    category: 'Language',
    minMonths: 2,
    maxMonths: 3,
    recommendedAge: '2-3 months'
  },
  {
    name: 'Holds Head Up',
    description: 'Holds head up when on tummy',
    category: 'Physical',
    minMonths: 2,
    maxMonths: 3,
    recommendedAge: '2-3 months'
  },
  {
    name: 'Smoother Movements',
    description: 'Moves arms and legs more smoothly',
    category: 'Physical',
    minMonths: 2,
    maxMonths: 3,
    recommendedAge: '2-3 months'
  },
  
  // 4-5 months
  {
    name: 'Smiles Spontaneously',
    description: 'Smiles on their own to get attention',
    category: 'Social-Emotional',
    minMonths: 4,
    maxMonths: 5,
    recommendedAge: '4-5 months'
  },
  {
    name: 'Babbling',
    description: 'Begins to babble with expression',
    category: 'Language',
    minMonths: 4,
    maxMonths: 5,
    recommendedAge: '4-5 months'
  },
  {
    name: 'Copies Sounds',
    description: 'Copies sounds they hear like cooing or babbling',
    category: 'Language',
    minMonths: 4,
    maxMonths: 5,
    recommendedAge: '4-5 months'
  },
  {
    name: 'Reaches for Toy',
    description: 'Reaches for a toy with one hand',
    category: 'Cognitive',
    minMonths: 4,
    maxMonths: 5,
    recommendedAge: '4-5 months'
  },
  {
    name: 'Holds Head Steady',
    description: 'Holds head steady without support',
    category: 'Physical',
    minMonths: 4,
    maxMonths: 5,
    recommendedAge: '4-5 months'
  },
  {
    name: 'Pushes to Elbows',
    description: 'Pushes up onto elbows when on tummy',
    category: 'Physical',
    minMonths: 4,
    maxMonths: 5,
    recommendedAge: '4-5 months'
  },
  {
    name: 'Rolls Tummy to Back',
    description: 'May be able to roll over from tummy to back',
    category: 'Physical',
    minMonths: 4,
    maxMonths: 5,
    recommendedAge: '4-5 months'
  },
  
  // 6-7 months
  {
    name: 'Knows Familiar Faces',
    description: 'Recognizes familiar faces and knows strangers',
    category: 'Social-Emotional',
    minMonths: 6,
    maxMonths: 7,
    recommendedAge: '6-7 months'
  },
  {
    name: 'Likes to Play',
    description: 'Enjoys playing with others especially parents',
    category: 'Social-Emotional',
    minMonths: 6,
    maxMonths: 7,
    recommendedAge: '6-7 months'
  },
  {
    name: 'Responds to Name',
    description: 'Responds to their own name',
    category: 'Language',
    minMonths: 6,
    maxMonths: 7,
    recommendedAge: '6-7 months'
  },
  {
    name: 'Makes Vowel Sounds',
    description: 'Begins making vowel sounds like "ah" "eh oh"',
    category: 'Language',
    minMonths: 6,
    maxMonths: 7,
    recommendedAge: '6-7 months'
  },
  {
    name: 'Curious',
    description: 'Looks around at nearby things showing curiosity',
    category: 'Cognitive',
    minMonths: 6,
    maxMonths: 7,
    recommendedAge: '6-7 months'
  },
  {
    name: 'Brings to Mouth',
    description: 'Brings objects to their mouth',
    category: 'Cognitive',
    minMonths: 6,
    maxMonths: 7,
    recommendedAge: '6-7 months'
  },
  {
    name: 'Rolls Both Ways',
    description: 'Rolls over both directions front to back and back to front',
    category: 'Physical',
    minMonths: 6,
    maxMonths: 7,
    recommendedAge: '6-7 months'
  },
  {
    name: 'Begins to Sit',
    description: 'Begins to sit without support',
    category: 'Physical',
    minMonths: 6,
    maxMonths: 7,
    recommendedAge: '6-7 months'
  },
  
  // 8-9 months
  {
    name: 'Stranger Anxiety',
    description: 'Fearful of strangers or clingy with familiar adults',
    category: 'Social-Emotional',
    minMonths: 8,
    maxMonths: 9,
    recommendedAge: '8-9 months'
  },
  {
    name: 'Has Favorite Toys',
    description: 'Has preferred toys',
    category: 'Social-Emotional',
    minMonths: 8,
    maxMonths: 9,
    recommendedAge: '8-9 months'
  },
  {
    name: 'Understands \'No\'',
    description: 'Understands the word no',
    category: 'Language',
    minMonths: 8,
    maxMonths: 9,
    recommendedAge: '8-9 months'
  },
  {
    name: 'Makes \'Mama\'/\'Baba\' Sounds',
    description: 'Makes sounds like mamamama or babababa',
    category: 'Language',
    minMonths: 8,
    maxMonths: 9,
    recommendedAge: '8-9 months'
  },
  {
    name: 'Plays Peek-a-boo',
    description: 'Understands object permanence and enjoys peek-a-boo',
    category: 'Cognitive',
    minMonths: 8,
    maxMonths: 9,
    recommendedAge: '8-9 months'
  },
  {
    name: 'Pincer Grasp',
    description: 'Picks up small items like cereal between thumb and index finger',
    category: 'Physical',
    minMonths: 8,
    maxMonths: 9,
    recommendedAge: '8-9 months'
  },
  {
    name: 'Pulls to Stand',
    description: 'Pulls up to standing position',
    category: 'Physical',
    minMonths: 8,
    maxMonths: 9,
    recommendedAge: '8-9 months'
  },
  {
    name: 'Crawls',
    description: 'Begins crawling or scooting',
    category: 'Physical',
    minMonths: 8,
    maxMonths: 9,
    recommendedAge: '8-9 months'
  },
  
  // 12-14 months
  {
    name: 'Walks Alone',
    description: 'Can take steps without support',
    category: 'Physical',
    minMonths: 12,
    maxMonths: 14,
    recommendedAge: '12-14 months'
  },
  {
    name: 'Uses Words',
    description: 'Uses simple words like mama or dada',
    category: 'Language',
    minMonths: 12,
    maxMonths: 14,
    recommendedAge: '12-14 months'
  },
  {
    name: 'Points to Objects',
    description: 'Points to objects they want',
    category: 'Cognitive',
    minMonths: 12,
    maxMonths: 14,
    recommendedAge: '12-14 months'
  },
  
  // 12-15 months
  {
    name: 'Drinks from Cup',
    description: 'Drinks from a cup without help',
    category: 'Physical',
    minMonths: 12,
    maxMonths: 15,
    recommendedAge: '12-15 months'
  },
  
  // 15-18 months
  {
    name: 'Climbs Stairs',
    description: 'Climbs stairs with support',
    category: 'Physical',
    minMonths: 15,
    maxMonths: 18,
    recommendedAge: '15-18 months'
  },
  {
    name: 'Feeds Self',
    description: 'Uses spoon or hands to feed themselves',
    category: 'Physical',
    minMonths: 15,
    maxMonths: 18,
    recommendedAge: '15-18 months'
  },
  {
    name: 'Understands Instructions',
    description: 'Follows simple instructions',
    category: 'Language',
    minMonths: 15,
    maxMonths: 18,
    recommendedAge: '15-18 months'
  },
  
  // 18-20 months
  {
    name: 'Uses Two-Word Phrases',
    description: 'Combines two words to express needs',
    category: 'Language',
    minMonths: 18,
    maxMonths: 20,
    recommendedAge: '18-20 months'
  },
  {
    name: 'Plays Simple Pretend',
    description: 'Engages in simple pretend play',
    category: 'Cognitive',
    minMonths: 18,
    maxMonths: 20,
    recommendedAge: '18-20 months'
  },
  {
    name: 'Walks Backwards',
    description: 'Can walk backwards steadily',
    category: 'Physical',
    minMonths: 18,
    maxMonths: 20,
    recommendedAge: '18-20 months'
  },
  {
    name: 'Runs',
    description: 'Can run short distances',
    category: 'Physical',
    minMonths: 18,
    maxMonths: 22,
    recommendedAge: '18-22 months'
  },
  
  // 20-22 months
  {
    name: 'Identifies Body Parts',
    description: 'Can point to body parts when asked',
    category: 'Cognitive',
    minMonths: 20,
    maxMonths: 22,
    recommendedAge: '20-22 months'
  },
  
  // 22-24 months
  {
    name: 'Uses Sentences',
    description: 'Forms short sentences of 3–4 words',
    category: 'Language',
    minMonths: 22,
    maxMonths: 24,
    recommendedAge: '22-24 months'
  },
  
  // 24-26 months
  {
    name: 'Sorts Shapes or Colors',
    description: 'Sorts objects by color or shape',
    category: 'Cognitive',
    minMonths: 24,
    maxMonths: 26,
    recommendedAge: '24-26 months'
  },
  {
    name: 'Shows Empathy',
    description: 'Shows concern when someone is upset',
    category: 'Social-Emotional',
    minMonths: 24,
    maxMonths: 26,
    recommendedAge: '24-26 months'
  },
  
  // 25-27 months
  {
    name: 'Balances on One Foot',
    description: 'Can stand on one foot briefly',
    category: 'Physical',
    minMonths: 25,
    maxMonths: 27,
    recommendedAge: '25-27 months'
  },
  
  // 26-28 months
  {
    name: 'Dresses with Help',
    description: 'Can put on clothes with some help',
    category: 'Physical',
    minMonths: 26,
    maxMonths: 28,
    recommendedAge: '26-28 months'
  },
  
  // 27-29 months
  {
    name: 'Counts 1–5',
    description: 'Can count objects up to five',
    category: 'Cognitive',
    minMonths: 27,
    maxMonths: 29,
    recommendedAge: '27-29 months'
  },
  
  // 28-30 months
  {
    name: 'Uses Pronouns',
    description: 'Uses words like I and you',
    category: 'Language',
    minMonths: 28,
    maxMonths: 30,
    recommendedAge: '28-30 months'
  },
  {
    name: 'Shares Toys',
    description: 'Can share toys with others',
    category: 'Social-Emotional',
    minMonths: 28,
    maxMonths: 30,
    recommendedAge: '28-30 months'
  },
  
  // 30-32 months
  {
    name: 'Draws Lines and Circles',
    description: 'Can draw basic shapes',
    category: 'Physical',
    minMonths: 30,
    maxMonths: 32,
    recommendedAge: '30-32 months'
  },
  {
    name: 'Understands Concepts of Size',
    description: 'Understands big vs small',
    category: 'Cognitive',
    minMonths: 30,
    maxMonths: 32,
    recommendedAge: '30-32 months'
  },
  
  // 32-33 months
  {
    name: 'Follows Two-Step Instructions',
    description: 'Follows instructions with two steps',
    category: 'Language',
    minMonths: 32,
    maxMonths: 33,
    recommendedAge: '32-33 months'
  },
  {
    name: 'Plays Cooperatively',
    description: 'Can play with peers taking turns',
    category: 'Social-Emotional',
    minMonths: 32,
    maxMonths: 33,
    recommendedAge: '32-33 months'
  }
];

// Initialize database with milestones
async function initializeDatabase() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected successfully to MongoDB');
    
    const db = client.db('1000steps');
    const collection = db.collection('milestones');
    
    // Check if milestones already exist
    const existingMilestones = await collection.countDocuments();
    
    if (existingMilestones > 0) {
      console.log(`⚠️  Database already contains ${existingMilestones} milestones. Skipping initialization.`);
      await client.close();
      process.exit(0);
    }

    // Insert new milestones
    const result = await collection.insertMany(newMilestones);
    
    console.log(`🎉 Successfully initialized database with ${result.insertedCount} milestones!`);
    console.log('\nMilestones by category:');
    const categories = {};
    newMilestones.forEach(milestone => {
      if (!categories[milestone.category]) {
        categories[milestone.category] = 0;
      }
      categories[milestone.category]++;
    });
    
    Object.keys(categories).forEach(category => {
      console.log(`  ${category}: ${categories[category]} milestones`);
    });
    
    console.log('\n✨ Database initialization complete!');
    console.log('You can now start the FirstSteps application.');
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    if (client) {
      await client.close();
    }
    process.exit(1);
  }
}

// Run the initialization
console.log('FirstSteps Database Initialization Script');
console.log('========================================');
console.log('This script will initialize your MongoDB database with 57 developmental milestones.');
console.log('');
initializeDatabase();