const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getAIInsights,
  chatWithAI
} = require('../controllers/aiController');

const router = express.Router();

// All routes are protected
router.use(protect);

// Routes
router.route('/insights/:infantId')
  .post(getAIInsights);

router.route('/chat/:infantId')
  .post(chatWithAI);

module.exports = router;