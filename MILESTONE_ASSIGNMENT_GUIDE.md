# Milestone Assignment Guide

This document explains how to use the new features we've implemented for the FirstSteps application.

## Overview

We've successfully implemented a complete backend system for tracking infant development milestones with the following features:

1. **User Authentication** - Registration, login, and JWT-based authentication
2. **Infant Management** - Create, read, update, and delete infant profiles
3. **Milestone Tracking** - Comprehensive milestone tracking with status updates
4. **API Integration** - Full REST API for frontend integration

## New Models

### User Model
Already existed with name, email, password (hashed), and role fields.

### Milestone Model
```javascript
{
  name: String,          // Required
  description: String,   // Optional
  category: String,      // Required: Cognitive, Language, Physical, Social-Emotional
  recommendedAge: String  // Required: e.g., "0-3 months"
}
```

### Infant Model
```javascript
{
  name: String,              // Required
  dateOfBirth: Date,         // Required
  gender: String,            // Required: male, female, other
  birthWeight: Number,       // Optional
  birthLength: Number,       // Optional
  parents: [{                // Array of parent references
    user: ObjectId,          // Reference to User
    relationship: String,    // Required
    isPrimary: Boolean       // Default: false
  }],
  medicalInfo: {             // Optional
    bloodType: String,
    allergies: [String],
    medications: [String],
    conditions: [String],
    pediatrician: {
      name: String,
      contact: String
    }
  },
  milestones: [{             // Auto-populated on creation
    milestoneId: ObjectId,   // Reference to Milestone
    status: String           // Default: "Not Started"
  }],
  avatar: String,            // Optional
  isActive: Boolean          // Default: true
}
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register user
- `POST /api/auth/login` - Authenticate user and return token

### Milestones
- `GET /api/milestones` - Get all milestones
- `POST /api/milestones/initialize` - Initialize default milestones (setup only)

### Infants
- `POST /api/infants` - Create new infant (with milestones auto-added)
- `GET /api/infants/:id` - Get detailed infant info (with milestone progress)
- `PUT /api/infants/:id/milestones/:milestoneId` - Update milestone status
- `GET /api/infants` - List infants for logged-in parent

## Integration with Frontend

### Sign In and Login Pages
Connect to:
- `/api/auth/signup` for registration
- `/api/auth/login` for authentication

### Dashboard
Fetch logged-in user's infants via `/api/infants`

### Infant Details Page
Display all baby info + milestone progress

### Milestone Update Buttons
Call `PUT /api/infants/:id/milestones/:milestoneId` to change status:
- Not Started
- Emerging
- Developing
- Achieved
- Mastered

## Setup Instructions

### 1. Database Configuration
Ensure your `.env` file has the correct MongoDB URI:
```
MONGODB_URI=mongodb://localhost:27017/1000steps
```

### 2. Initialize Milestones
Run the following command to populate the database with default milestones:
```bash
cd backend
npm run seed:milestones
```

### 3. Start the Server
```bash
npm run dev
```

## Testing the Implementation

### 1. Register a New User
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Parent",
    "email": "parent@test.com",
    "password": "password123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@test.com",
    "password": "password123"
  }'
```

Save the token from the response for subsequent requests.

### 3. Create an Infant
```bash
curl -X POST http://localhost:5001/api/infants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Baby Test",
    "dateOfBirth": "2023-01-01",
    "gender": "male",
    "birthWeight": 3.2,
    "birthLength": 50
  }'
```

### 4. Get Infant Details
```bash
curl -X GET http://localhost:5001/api/infants/INFANT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Update Milestone Status
```bash
curl -X PUT http://localhost:5001/api/infants/INFANT_ID/milestones/MILESTONE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "Achieved"
  }'
```

## Frontend Integration

The frontend API integration has been updated in `frontend/lib/api.ts` with the following new functions:

### Infants API
- `infantsAPI.getInfants()` - Get all infants for logged in parent
- `infantsAPI.getInfant(id)` - Get specific infant details
- `infantsAPI.createInfant(data)` - Create new infant
- `infantsAPI.updateMilestoneStatus(infantId, milestoneId, status)` - Update milestone status
- `infantsAPI.deleteInfant(id)` - Delete infant

### Milestones API
- `milestonesAPI.getMilestones()` - Get all milestones
- `milestonesAPI.getMilestone(id)` - Get specific milestone
- `milestonesAPI.initializeMilestones()` - Initialize default milestones

## Sample Data

When you run `npm run seed:milestones`, the following categories of milestones will be created:

1. **Cognitive Milestones** (6)
2. **Language Milestones** (6)
3. **Physical Milestones** (6)
4. **Social-Emotional Milestones** (6)

Total: 24 sample milestones covering development from 0-24 months.

## Virtual Fields

The Infant model includes two virtual fields for automatic age calculation:
- `ageInMonths` - Automatically calculated from dateOfBirth
- `ageInDays` - Automatically calculated from dateOfBirth

These fields are included when retrieving infant data and help with displaying relevant information in the frontend.

## Error Handling

All API endpoints include proper error handling for:
- Validation errors
- Authentication errors
- Database errors
- Resource not found errors

## Security Features

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Rate limiting to prevent abuse
- CORS configuration for frontend integration
- Input validation on all endpoints

## Next Steps

1. Connect the frontend components to the new API endpoints
2. Implement the dashboard to display infant data
3. Create forms for adding new infants
4. Build the milestone tracking interface
5. Add proper error handling and user feedback in the UI