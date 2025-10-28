const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Create zip file of the setup directory
const setupDir = path.join(__dirname, 'firststeps-setup');
const zipFile = path.join(__dirname, 'firststeps-setup.zip');

console.log('Creating zip file for FirstSteps setup...');

// Execute zip command
exec(`zip -r "${zipFile}" .`, { cwd: setupDir }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error creating zip file: ${error}`);
    return;
  }
  
  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
  
  console.log(`✅ Successfully created ${zipFile}`);
  console.log('This package contains everything needed to initialize the FirstSteps database with milestones.');
  console.log('\nTo use this package:');
  console.log('1. Extract the zip file');
  console.log('2. Edit the MongoDB connection string in init-db.js if needed');
  console.log('3. Run `node init-db.js` to initialize the database with milestones');
});