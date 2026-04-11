const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const { protect } = require('../middleware/auth');

router.post('/chat', protect, assistantController.processAssistantQuery);

module.exports = router;
