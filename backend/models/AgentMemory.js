'use strict';

/**
 * AgentMemory.js
 * 
 * Stores the last N agent interactions per user for context continuity.
 * Each user has one document with an array of recent interactions.
 */

const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  response: {
    type: String,
    required: true,
  },
  toolsUsed: [{
    type: String,
  }],
  provider: {
    type: String,
    enum: ['gemini', 'unknown'],
    default: 'unknown',
  },
  contextUsed: {
    type: Boolean,
    default: false,
  },
  infantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Infant',
    default: null,
  },
  currentPage: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const agentMemorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One memory document per user
  },
  interactions: {
    type: [interactionSchema],
    default: [],
  },
}, {
  timestamps: true,
});

// Note: userId already has an index from `unique: true`

module.exports = mongoose.model('AgentMemory', agentMemorySchema);
