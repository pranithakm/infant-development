const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Infant = require('../models/Infant');
const Milestone = require('../models/Milestone');

describe('Infant API', () => {
  let token;
  let userId;
  let milestoneId;

  beforeAll(async () => {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/1000steps-test');
    
    // Create a test user
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'parent'
    });
    
    userId = user._id;
    
    // Generate token
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    token = res.body.token;
    
    // Create a test milestone
    const milestone = await Milestone.create({
      name: 'Test Milestone',
      description: 'Test description',
      category: 'Cognitive',
      recommendedAge: '0-3 months'
    });
    
    milestoneId = milestone._id;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Infant.deleteMany({});
    await Milestone.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/infants', () => {
    it('should create a new infant with milestones', async () => {
      const res = await request(app)
        .post('/api/infants')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Infant',
          dateOfBirth: '2023-01-01',
          gender: 'male',
          birthWeight: 3.2,
          birthLength: 50
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Infant');
      expect(res.body.data.milestones.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/infants', () => {
    it('should get all infants for the logged in parent', async () => {
      const res = await request(app)
        .get('/api/infants')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });
});