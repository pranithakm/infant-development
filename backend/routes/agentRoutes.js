'use strict';

/**
 * agentRoutes.js
 * 
 * Routes for the global AI agent system.
 * All routes are protected by the auth middleware.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { chat, getMemory, clearMemory } = require('../controllers/agentController');

// Protect all agent routes — user must be authenticated
router.use(protect);

// Main agent chat endpoint
router.post('/chat', chat);

// Conversation memory management
router.get('/memory', getMemory);
router.delete('/memory', clearMemory);

module.exports = router;
