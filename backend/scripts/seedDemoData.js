/**
 * seedDemoData.js
 * 
 * Creates 2 users with 1 infant each, populated with a full year of
 * realistic data: growth, milestones, routines, calendar activities,
 * personalized routines, chat history, and AI insights.
 * 
 * Usage:  node scripts/seedDemoData.js
 * 
 * Users created:
 *   prani  (prani@firststeps.com  / password123)  → infant: Ayan  (boy)
 *   prada  (prada@firststeps.com  / password123)  → infant: Puvisha (girl)
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Infant = require('../models/Infant');
const Growth = require('../models/Growth');
const Routine = require('../models/Routine');
const Milestone = require('../models/Milestone');
const Scheme = require('../models/Scheme');
require('dotenv').config();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return a date N days ago from today */
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(8, 0, 0, 0);
  return d;
};

/** Random float between min and max, rounded to decimals */
const rand = (min, max, decimals = 1) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

/** Pick a random item from an array */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Format date as YYYY-MM-DD string */
const dateStr = (d) => d.toISOString().split('T')[0];

// ---------------------------------------------------------------------------
// Growth curves (realistic WHO-based approximate values over 12 months)
// ---------------------------------------------------------------------------

// Boy growth (Ayan) — birth to 12 months
const boyGrowth = [
  // month, weight(kg), height(cm), headCirc(cm)
  [0,  3.3,  50.0, 34.5],
  [1,  4.5,  54.7, 37.3],
  [2,  5.6,  58.4, 39.1],
  [3,  6.4,  61.4, 40.5],
  [4,  7.0,  63.9, 41.6],
  [5,  7.5,  65.9, 42.6],
  [6,  7.9,  67.6, 43.3],
  [7,  8.3,  69.2, 44.0],
  [8,  8.6,  70.6, 44.5],
  [9,  8.9,  72.0, 45.0],
  [10, 9.2,  73.3, 45.4],
  [11, 9.4,  74.5, 45.8],
  [12, 9.6,  75.7, 46.1],
];

// Girl growth (Puvisha) — birth to 12 months
const girlGrowth = [
  [0,  3.2,  49.1, 33.9],
  [1,  4.2,  53.7, 36.5],
  [2,  5.1,  57.1, 38.3],
  [3,  5.8,  59.8, 39.5],
  [4,  6.4,  62.1, 40.6],
  [5,  6.9,  64.0, 41.5],
  [6,  7.3,  65.7, 42.2],
  [7,  7.6,  67.3, 42.8],
  [8,  7.9,  68.7, 43.4],
  [9,  8.2,  70.1, 43.8],
  [10, 8.5,  71.5, 44.2],
  [11, 8.7,  72.8, 44.6],
  [12, 8.9,  74.0, 44.9],
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seed() {
  const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/1000steps';
  await mongoose.connect(dbUri);
  console.log('Connected to MongoDB');

  // ── 1. Ensure milestones, routines, schemes exist ──
  let milestones = await Milestone.find({}).lean();
  if (milestones.length === 0) {
    console.log('No milestones found — run `npm run seed:milestones` first.');
    process.exit(1);
  }
  console.log(`Found ${milestones.length} milestones`);

  let routines = await Routine.find({ isPersonalized: { $ne: true } }).lean();
  if (routines.length === 0) {
    console.log('No routines found — run `npm run seed:routines` first.');
    process.exit(1);
  }
  console.log(`Found ${routines.length} general routines`);

  const schemes = await Scheme.find({}).lean();
  console.log(`Found ${schemes.length} schemes`);

  // ── 2. Create / update users ──
  const usersData = [
    { name: 'prani', email: 'prani@firststeps.com', password: 'password123', role: 'parent' },
    { name: 'prada', email: 'prada@firststeps.com', password: 'password123', role: 'parent' },
  ];

  const users = [];
  for (const u of usersData) {
    let user = await User.findOne({ email: u.email });
    if (user) {
      console.log(`User "${u.name}" already exists — reusing`);
    } else {
      user = await User.create(u);
      console.log(`Created user "${u.name}"`);
    }
    users.push(user);
  }

  // ── 3. Infant configs ──
  const infantConfigs = [
    {
      user: users[0],
      name: 'Ayan',
      gender: 'male',
      growthCurve: boyGrowth,
      dobDaysAgo: 365, // born ~1 year ago
      bloodType: 'B+',
      allergies: ['Peanuts'],
      conditions: [],
    },
    {
      user: users[1],
      name: 'Puvisha',
      gender: 'female',
      growthCurve: girlGrowth,
      dobDaysAgo: 365,
      bloodType: 'O+',
      allergies: [],
      conditions: [],
    },
  ];

  for (const cfg of infantConfigs) {
    console.log(`\n━━━ Seeding infant: ${cfg.name} ━━━`);

    const dob = daysAgo(cfg.dobDaysAgo);

    // Delete existing infant for this user (clean re-seed)
    const existingInfants = await Infant.find({ 'parents.user': cfg.user._id }, '_id').lean();
    const existingInfantIds = existingInfants.map(i => i._id);

    // Clean up related data for this user's infants only
    if (existingInfantIds.length > 0) {
      await Growth.deleteMany({ infant: { $in: existingInfantIds } });
      await Routine.deleteMany({ isPersonalized: true, infantId: { $in: existingInfantIds } });
    }
    await Infant.deleteMany({ 'parents.user': cfg.user._id });

    // ── 3a. Personalized routines ──
    const personalizedRoutineData = [
      { name: `${cfg.name}'s Massage Time`, description: 'Gentle oil massage for relaxation and bonding', category: 'personalized', isPersonalized: true, duration: 15, recommendedFrequency: 'daily' },
      { name: `${cfg.name}'s Story Time`, description: 'Read colorful picture books before bed', category: 'personalized', isPersonalized: true, duration: 10, recommendedFrequency: 'daily' },
      { name: `${cfg.name}'s Music Session`, description: 'Play soothing nursery rhymes and lullabies', category: 'personalized', isPersonalized: true, duration: 15, recommendedFrequency: 'daily' },
    ];

    // We'll set infantId after creating the infant
    const personalizedRoutines = [];

    // ── 3b. Build milestone assignments ──
    // Assign all milestones up to 12 months
    const ageMonths = 12;
    const milestoneAssignments = [];
    for (const ms of milestones) {
      if (ms.maxMonths <= ageMonths + 2) {
        let status;
        if (ms.maxMonths <= ageMonths - 2) {
          // Well past — should be achieved or mastered
          status = pick(['Achieved', 'Mastered', 'Mastered']);
        } else if (ms.maxMonths <= ageMonths) {
          // Within range — mix of statuses
          status = pick(['Achieved', 'Developing', 'Achieved', 'Mastered']);
        } else {
          // Slightly ahead — emerging or not started
          status = pick(['Not Started', 'Emerging', 'Emerging', 'Developing']);
        }
        milestoneAssignments.push({
          milestoneId: ms._id,
          status,
        });
      }
    }
    console.log(`  Milestones assigned: ${milestoneAssignments.length}`);

    // ── 3c. Build growth data (inline on infant) ──
    const inlineGrowth = [];
    for (const [month, w, h, hc] of cfg.growthCurve) {
      const date = new Date(dob);
      date.setMonth(date.getMonth() + month);
      // Add tiny realistic noise
      inlineGrowth.push({
        date,
        weight: parseFloat((w + rand(-0.2, 0.2)).toFixed(1)),
        height: parseFloat((h + rand(-0.5, 0.5)).toFixed(1)),
        headCircumference: parseFloat((hc + rand(-0.2, 0.2)).toFixed(1)),
      });
    }

    // ── 3d. Build routine tracking (365 days) ──
    const allRoutineIds = routines.map(r => r._id);
    const routineTracking = [];
    for (let day = 0; day < 365; day++) {
      const d = daysAgo(365 - day);
      // Each day, randomly complete 5–9 of the 10 routines
      const count = Math.floor(Math.random() * 5) + 5;
      const shuffled = [...allRoutineIds].sort(() => Math.random() - 0.5);
      routineTracking.push({
        date: dateStr(d),
        routineIds: shuffled.slice(0, count),
      });
    }
    console.log(`  Routine days tracked: ${routineTracking.length}`);

    // ── 3e. Build calendar activities ──
    const calendarActivities = [];

    // Monthly growth entries
    for (const g of inlineGrowth) {
      calendarActivities.push({
        date: g.date,
        activity: `Growth measurement: W=${g.weight}kg, H=${g.height}cm`,
        type: 'growth',
        values: { height: g.height, weight: g.weight, headCircumference: g.headCircumference },
      });
    }

    // Milestone achievements
    const achievedMilestones = milestoneAssignments.filter(m =>
      m.status === 'Achieved' || m.status === 'Mastered'
    );
    for (const am of achievedMilestones.slice(0, 20)) {
      const ms = milestones.find(m => m._id.toString() === am.milestoneId.toString());
      if (ms) {
        const achieveDate = new Date(dob);
        achieveDate.setMonth(achieveDate.getMonth() + ms.minMonths + Math.floor(Math.random() * (ms.maxMonths - ms.minMonths + 1)));
        calendarActivities.push({
          date: achieveDate,
          activity: `Milestone: ${ms.name}`,
          type: 'milestone',
          status: am.status,
        });
      }
    }

    // Special occasions
    const specialDates = [
      { offset: 0, activity: '🎂 Birth day!' },
      { offset: 30, activity: '🎉 1 month celebration' },
      { offset: 90, activity: '📷 3 month photo shoot' },
      { offset: 180, activity: '🎂 Half birthday celebration' },
      { offset: 270, activity: '🏥 9 month health checkup' },
      { offset: 365, activity: '🎂 First birthday!' },
    ];
    for (const sd of specialDates) {
      const d = new Date(dob);
      d.setDate(d.getDate() + sd.offset);
      calendarActivities.push({
        date: d,
        activity: sd.activity,
        type: 'special_occasion',
      });
    }
    console.log(`  Calendar activities: ${calendarActivities.length}`);

    // ── 3f. Chat history ──
    const chatHistory = [
      { role: 'user', content: `How is ${cfg.name} doing overall?`, timestamp: daysAgo(30) },
      { role: 'assistant', content: `${cfg.name} is developing beautifully! Growth is on track and milestones are progressing well for ${cfg.gender === 'male' ? 'his' : 'her'} age.`, timestamp: daysAgo(30) },
      { role: 'user', content: 'Any concerns about weight?', timestamp: daysAgo(15) },
      { role: 'assistant', content: `${cfg.name}'s weight is following a healthy percentile curve. No concerns at this time — keep up the current feeding routine!`, timestamp: daysAgo(15) },
      { role: 'user', content: 'What milestones should I focus on next?', timestamp: daysAgo(5) },
      { role: 'assistant', content: `At 12 months, focus on encouraging first steps, simple words like "mama" and "dada", and interactive play. ${cfg.name} is right on track!`, timestamp: daysAgo(5) },
    ];

    // ── 3g. AI Insights ──
    const insights = {
      development_summary: `${cfg.name} is a healthy ${ageMonths}-month-old ${cfg.gender === 'male' ? 'boy' : 'girl'} showing excellent developmental progress across all domains.`,
      growth_analysis: `Weight and height follow the expected WHO growth curve. Current weight is ${cfg.growthCurve[12][1]} kg and height is ${cfg.growthCurve[12][2]} cm, both within healthy range.`,
      strengths: [
        'Strong physical development — rolling, sitting, and beginning to stand',
        'Good social engagement — responds to name and familiar faces',
        'Healthy appetite and consistent weight gain',
        'Active curiosity and object exploration',
      ],
      possible_delays: [
        'Monitor language development — ensure babbling is progressing to simple words',
      ],
      recommended_upcoming_milestones: [
        'Walking independently',
        'Using simple words (mama, dada)',
        'Pointing to objects of interest',
        'Drinking from a cup',
      ],
      routine_compliance: 'Excellent routine adherence with 85%+ daily completion rate over the past year.',
      suggested_routines: [
        'Outdoor exploration walk (15 min)',
        'Finger painting activity (10 min)',
        'Stacking blocks practice (10 min)',
      ],
      eligible_schemes: schemes.length > 0
        ? schemes.slice(0, 3).map(s => s.name)
        : ['Janani Suraksha Yojana', 'ICDS', 'Pradhan Mantri Matru Vandana Yojana'],
      parenting_recommendations: [
        'Introduce more textured foods for oral motor development',
        'Encourage standing and cruising along furniture',
        'Read picture books daily for language stimulation',
        'Maintain consistent sleep schedule',
        'Schedule 12-month well-baby checkup',
      ],
      nutrition_insights: [
        'Transition to 3 meals + 2 snacks per day',
        'Introduce soft finger foods like banana pieces and steamed vegetables',
        'Continue breastfeeding or formula alongside solid foods',
        'Ensure adequate iron intake through fortified cereals or meats',
        'Offer water in a sippy cup during meals',
      ],
    };

    // ── 3h. Create infant document ──
    const latestGrowth = inlineGrowth[inlineGrowth.length - 1];
    const infant = await Infant.create({
      name: cfg.name,
      dateOfBirth: dob,
      gender: cfg.gender,
      birthWeight: cfg.growthCurve[0][1],
      birthLength: cfg.growthCurve[0][2],
      birthHeadCircumference: cfg.growthCurve[0][3],
      currentWeight: latestGrowth.weight,
      currentHeight: latestGrowth.height,
      currentHeadCircumference: latestGrowth.headCircumference,
      growthData: inlineGrowth,
      calendarActivities,
      routines: routineTracking,
      parents: [{
        user: cfg.user._id,
        relationship: 'Mother',
        isPrimary: true,
      }],
      medicalInfo: {
        bloodType: cfg.bloodType,
        allergies: cfg.allergies,
        medications: [],
        conditions: cfg.conditions,
        pediatrician: { name: 'Dr. Sharma', contact: '+91 9876543210' },
      },
      milestones: milestoneAssignments,
      insights,
      chatHistory,
      isActive: true,
    });

    console.log(`  Infant "${cfg.name}" created (ID: ${infant._id})`);

    // ── 3i. Create Growth collection records (separate from inline) ──
    const growthDocs = inlineGrowth.map(g => ({
      infant: infant._id,
      date: g.date,
      weight: g.weight,
      height: g.height,
      headCircumference: g.headCircumference,
      notes: `Month ${Math.round((g.date - dob) / (30.44 * 24 * 60 * 60 * 1000))} measurement`,
    }));
    await Growth.insertMany(growthDocs);
    console.log(`  Growth records: ${growthDocs.length}`);

    // ── 3j. Create personalized routines ──
    for (const pr of personalizedRoutineData) {
      const routine = await Routine.create({ ...pr, infantId: infant._id });
      personalizedRoutines.push(routine);
    }
    console.log(`  Personalized routines: ${personalizedRoutines.length}`);

    console.log(`  ✅ ${cfg.name} seeded completely!`);
  }

  // ── Summary ──
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Demo data seeding complete!\n');
  console.log('Login credentials:');
  console.log('  prani@firststeps.com / password123  → Infant: Ayan (boy)');
  console.log('  prada@firststeps.com / password123  → Infant: Puvisha (girl)');
  console.log('\nEach infant has:');
  console.log('  • 13 monthly growth measurements');
  console.log('  • 365 days of routine tracking');
  console.log('  • All age-appropriate milestones assigned with statuses');
  console.log('  • Calendar activities (growth, milestones, special events)');
  console.log('  • 3 personalized routines');
  console.log('  • Chat history & AI insights pre-populated');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.connection.close();
  process.exit(0);
}

// Run
seed().catch(err => {
  console.error('❌ Seed failed:', err);
  mongoose.connection.close();
  process.exit(1);
});
