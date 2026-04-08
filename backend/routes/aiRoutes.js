const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  getAIInsights,
  chatWithAI,
  getChatHistory,
  regenerateInsights
} = require('../controllers/aiController');

// protect all ai routes
router.use(protect);

// AI Insights
router.post('/insights/:infantId', getAIInsights);
router.post('/insights/:infantId/regenerate', regenerateInsights);

// AI Chat
router.post('/chat/:infantId', chatWithAI);
router.get('/chat/:infantId', getChatHistory);

module.exports = router;