# FirstSteps

A full-stack web application with AI-powered developmental monitoring and personalized recommendations for infants aged 0-3 years.

## Features

- **AI-Powered Analysis**: Intelligent monitoring and personalized recommendations
- **Milestone Tracking**: Comprehensive tracking of developmental milestones
- **Growth Tracking**: Monitor height, weight, and head circumference with interactive charts, including birth values as starting points
- **Interactive Dashboard**: Visual progress tracking and analytics
- **Chatbot Interface**: AI-powered guidance for parents and caregivers
- **Secure Data Storage**: HIPAA-compliant data handling
- **Real-time Notifications**: Milestone reminders and activity suggestions

## Tech Stack

### Frontend
- **Next.js 14** - React framework with app router
- **TailwindCSS** - Utility-first CSS framework
- **Chart.js** - Data visualization
- **React Hook Form** - Form handling
- **Zustand** - State management

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **JWT** - Authentication
- **OpenAI API** - AI agent integration
- **Mongoose** - MongoDB ODM

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- OpenAI API key

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values (especially OPENAI_API_KEY and MONGODB_URI)
npm run seed:milestones  # Seed basic milestones
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local if needed
npm run dev
```

Visit `http://localhost:3000` to access the application.

### First Time Setup
1. **Set up environment variables** in both backend/.env and frontend/.env.local
2. **Get an OpenAI API key** from https://platform.openai.com
3. **Start MongoDB** (local or use MongoDB Atlas)
4. **Seed milestones** by running `npm run seed:milestones` in the backend directory
5. **Start both servers** using the start script: `./start.sh` or manually start both
6. **Register a new account** and start tracking your infant's development!

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change user password

### Milestones
- `GET /api/milestones` - Get all milestones
- `GET /api/milestones/:id` - Get a specific milestone
- `POST /api/milestones/initialize` - Initialize default milestones (setup only)

### Infants
- `GET /api/infants` - Get all infants for logged in parent
- `POST /api/infants` - Create a new infant
- `GET /api/infants/:id` - Get a specific infant with milestone progress
- `PUT /api/infants/:id/milestones/:milestoneId` - Update milestone status for infant
- `DELETE /api/infants/:id` - Soft delete an infant

### Growth Measurements
- `GET /api/growth/infant/:infantId` - Get all growth measurements for an infant
- `POST /api/growth` - Add a new growth measurement
- `PUT /api/growth/:id` - Update a growth measurement
- `DELETE /api/growth/:id` - Delete a growth measurement

### AI Insights (Gemini API)
- `POST /api/ai/insights/:infantId` - Get AI-powered developmental insights for an infant
- `POST /api/ai/chat/:infantId` - Chat with AI about infant development

## Environment Variables

### Backend (.env)
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/1000steps

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d

# OpenAI Configuration (Optional - for legacy features)
OPENAI_API_KEY=your_openai_api_key_here

# Gemini API Configuration
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Server Configuration
PORT=5001
NODE_ENV=development

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

## Setting up Gemini API

To use the AI-powered insights feature, you need to:

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Copy the API key
4. Paste it in the backend `.env` file as the value for `GEMINI_API_KEY`
5. Restart the backend server

## Development

The application is structured as follows:
- `/backend` - Express.js API server
- `/frontend` - Next.js React application

## Deployment

Instructions for deploying to production environments are included in the respective directories.

## License

MIT License# FirstSteps - Infant Development Tracking Application
