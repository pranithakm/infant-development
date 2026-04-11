const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying FirstSteps Backend Setup...\n');

// Check if required files exist
const requiredFiles = [
  'models/User.js',
  'models/Infant.js',
  'models/Milestone.js',
  'controllers/infantController.js',
  'controllers/milestoneController.js',
  'routes/infantRoutes.js',
  'routes/milestoneRoutes.js',
  'server.js'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file} - Found`);
  } else {
    console.log(`❌ ${file} - Missing`);
    allFilesExist = false;
  }
});

console.log('\n');

// Check if routes are registered in server.js
const serverJsPath = path.join(__dirname, '..', 'server.js');
const serverJsContent = fs.readFileSync(serverJsPath, 'utf8');

if (serverJsContent.includes("app.use('/api/infants'")) {
  console.log('✅ Infant routes registered in server.js');
} else {
  console.log('❌ Infant routes NOT registered in server.js');
}

if (serverJsContent.includes("app.use('/api/milestones'")) {
  console.log('✅ Milestone routes registered in server.js');
} else {
  console.log('❌ Milestone routes NOT registered in server.js');
}

console.log('\n');

// Check if database name is correct in .env files
const envFiles = ['.env', '.env.example'];
const correctDbName = '1000steps';

envFiles.forEach(envFile => {
  const envPath = path.join(__dirname, '..', envFile);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes(`MONGODB_URI=mongodb://localhost:27017/${correctDbName}`)) {
      console.log(`✅ Database name correct in ${envFile}`);
    } else {
      console.log(`❌ Database name incorrect in ${envFile}`);
    }
  }
});

console.log('\n');

// Check if seed script is in package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (packageJson.scripts && packageJson.scripts['seed:milestones']) {
  console.log('✅ Seed milestones script registered in package.json');
} else {
  console.log('❌ Seed milestones script NOT registered in package.json');
}

console.log('\n');

if (allFilesExist) {
  console.log('🎉 All required files are present!');
} else {
  console.log('⚠️  Some required files are missing!');
}

console.log('\n📝 Next steps:');
console.log('1. Make sure MongoDB is running');
console.log('2. Run `npm run seed:milestones` to initialize milestones');
console.log('3. Start the server with `npm run dev`');
console.log('4. Test the API endpoints');