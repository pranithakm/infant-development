# Build and run backend
cd backend && npm install && npm run dev &

# Build and run frontend  
cd frontend && npm install && npm run dev &

echo "🚀 Starting FirstSteps..."
echo "📱 Frontend: http://localhost:3000"
echo "🔗 Backend API: http://localhost:5000"
echo "📊 Health Check: http://localhost:5000/health"
echo ""
echo "Demo Login:"
echo "Email: demo@infantdev.com" 
echo "Password: demo123"
echo ""
echo "⚠️  Make sure to:"
echo "1. Set up MongoDB (local or Atlas)"
echo "2. Configure environment variables"
echo "3. Run 'npm run seed' in backend to add sample data"