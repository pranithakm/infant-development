# FirstSteps - Infant Development Tracker Database Setup

## Overview
This package contains a standalone script to initialize a MongoDB database with 57 standardized developmental milestones for the FirstSteps infant development tracking application.

## Prerequisites
- MongoDB instance (local or cloud)
- Node.js (to run the initialization script)

## Setup Instructions

1. **Extract this package** to a folder on your computer

2. **Configure database connection**:
   - Open the `init-db.js` file in a text editor
   - Find the line `MONGODB_URI=mongodb://localhost:27017/1000steps` 
   - Replace with your MongoDB connection string if different

3. **Run the initialization script**:
   - Open a terminal/command prompt
   - Navigate to the extracted folder
   - Run: `node init-db.js`

## What This Script Does

The script will:
- Connect to your MongoDB instance
- Create a collection for milestones
- Insert all 57 standardized developmental milestones across 4 categories:
  - Cognitive
  - Language
  - Physical
  - Social-Emotional
- Milestones are organized by age ranges from 1-2 months up to 32-33 months
- Each milestone includes minMonths and maxMonths for proper sorting and filtering

## Features
- No package installation required
- Single file execution
- HIPAA-compliant data structure
- Pre-configured with standardized milestones based on pediatric research

## Support
For issues or questions, please refer to the main FirstSteps documentation or contact the development team.