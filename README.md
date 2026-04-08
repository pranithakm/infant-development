# FirstSteps - Infant Development Tracking Platform

## Overview
A full-stack web application for tracking infant development and providing personalized recommendations for infants aged 0-3 years.

## Key Features
- **Developmental Milestone Tracking**: Comprehensive monitoring across cognitive, physical, language, and social-emotional domains
- **Growth Monitoring**: Visual charts and progress tracking for height, weight, and head circumference
- **Activity Calendar**: Daily activity logging and scheduling
- **Routine Management**: Customizable daily routines and habit tracking
- **Progress Analytics**: Detailed insights and progress reports
- **AI-Powered Insights**: Personalized developmental recommendations using Google Gemini
- **Multi-language Support**: Available in English, Tamil, Hindi, and Telugu

## Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based authentication
- **AI Integration**: Google Gemini API
- **Deployment**: Docker-ready with PM2 process management

## Prerequisites
- Node.js (v18 or higher)
- MongoDB (v5.0 or higher)
- npm or yarn package manager

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd firststeps
```

### 2. Environment Setup
```bash
# Backend setup
cd backend
cp .env.example .env
# Edit .env with your values (especially MONGODB_URI and GEMINI_API_KEY)

# Frontend setup
cd ../frontend
cp .env.example .env
# Edit .env with your values
```

### 3. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 4. Database Initialization
```bash
# Start MongoDB service
# Then initialize data
cd backend
npm run seed:milestones
npm run seed:routines
npm run seed:schemes
```

### 5. Run the Application
```bash
# Start backend server
cd backend
npm run dev

# Start frontend development server (in a new terminal)
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend (.env)
```
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Infants
- `GET /api/infants` - Get all infants for current user
- `GET /api/infants/:id` - Get specific infant details
- `POST /api/infants` - Create new infant profile
- `PUT /api/infants/:id` - Update infant profile
- `DELETE /api/infants/:id` - Delete infant profile
- `PUT /api/infants/:infantId/milestones/:milestoneId` - Update milestone status

### Milestones
- `GET /api/milestones` - Get all developmental milestones
- `GET /api/milestones/:id` - Get specific milestone details
- `POST /api/milestones/initialize` - Initialize milestone data

### Growth Tracking
- `GET /api/growth/infant/:infantId` - Get growth measurements for infant
- `POST /api/growth` - Add new growth measurement
- `PUT /api/growth/:id` - Update growth measurement
- `DELETE /api/growth/:id` - Delete growth measurement

### Routines
- `GET /api/routines` - Get all routines
- `GET /api/routines/infants/:infantId/date/:date` - Get routines for infant on specific date
- `PUT /api/routines/infants/:infantId/date/:date/routine/:routineId` - Update routine completion status

### Schemes
- `GET /api/schemes` - Get all government schemes
- `GET /api/schemes/:id` - Get specific scheme details

### AI Insights
- `POST /api/ai/insights/:infantId` - Generate developmental insights for infant
- `POST /api/ai/insights/:infantId/regenerate` - Regenerate developmental insights for infant
- `POST /api/ai/chat/:infantId` - Chat with AI assistant
- `GET /api/ai/chat/:infantId` - Get chat history

## AI Integration

The application uses Google's Gemini API to generate personalized developmental insights for each infant. The AI service:

1. Loads common datasets (milestones, routines, schemes) from MongoDB on startup
2. Combines infant-specific data with common datasets when generating insights
3. Returns structured JSON responses with developmental recommendations
4. Stores insights in the infant's profile for future reference

To enable AI features:
1. Add your Google Gemini API key to the backend `.env` file
2. Restart the backend server
3. Access AI insights through the infant dashboard

## Deployment

### Production Build
```bash
# Build frontend
cd frontend
npm run build

# Start production servers
cd ../backend
npm start
```

### Docker Deployment
The application includes Docker configuration files for easy deployment.

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License
This project is licensed under the MIT License.# infant
