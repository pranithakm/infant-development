'use strict';

/**
 * agentController.js
 * 
 * Express controller for the Agentic AI endpoints.
 * This is SEPARATE from the existing aiController.js —
 * the original insights/chat functionality is untouched.
 * 
 * Endpoints:
 *   POST   /api/agent/chat   — send a question to the global AI agent
 *   GET    /api/agent/memory — retrieve conversation history
 *   DELETE /api/agent/memory — clear conversation history
 */

const agentService = require('../services/agent/agentService');
const memoryService = require('../services/agent/memoryService');

// ---------------------------------------------------------------------------
// POST /api/agent/chat
// ---------------------------------------------------------------------------

/**
 * Main agent chat endpoint.
 * 
 * Request body:
 *   {
 *     infantId:    string (optional — ObjectId of the selected infant),
 *     question:    string (required — the user's question),
 *     currentPage: string (optional — e.g. "dashboard", "growth"),
 *     lastAction:  string (optional — e.g. "viewed growth chart")
 *   }
 * 
 * Response:
 *   {
 *     success:     true,
 *     data: {
 *       response:    string,
 *       provider:    string,
 *       toolsUsed:   string[],
 *       contextUsed: boolean
 *     }
 *   }
 */
const chat = async (req, res) => {
  try {
    const { infantId, question, currentPage, lastAction } = req.body;

    // Validate required fields
    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question is required.',
      });
    }

    // req.user is set by the auth middleware
    const userId = req.user._id || req.user.id;

    console.log(`[AgentController] Chat request from user ${userId}, page="${currentPage}", infant="${infantId || 'none'}"`);

    // Process through the agent pipeline
    const result = await agentService.processQuery({
      userId,
      infantId: infantId || null,
      question: question.trim(),
      currentPage: currentPage || '',
      lastAction: lastAction || '',
    });

    return res.status(200).json({
      success: true,
      data: {
        response: result.response,
        provider: result.provider,
        toolsUsed: result.toolsUsed,
        contextUsed: result.contextUsed,
        navigateTo: result.navigateTo || null,
        suggestedRoutines: result.suggestedRoutines || [],
      },
    });
  } catch (error) {
    console.error('[AgentController] Chat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process your question. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ---------------------------------------------------------------------------
// GET /api/agent/memory
// ---------------------------------------------------------------------------

/**
 * Retrieve the user's conversation memory.
 */
const getMemory = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const interactions = await memoryService.getRecentInteractions(userId);

    return res.status(200).json({
      success: true,
      data: {
        interactions,
        count: interactions.length,
      },
    });
  } catch (error) {
    console.error('[AgentController] Get memory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversation history.',
    });
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/agent/memory
// ---------------------------------------------------------------------------

/**
 * Clear the user's conversation memory.
 */
const clearMemory = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    await memoryService.clearMemory(userId);

    return res.status(200).json({
      success: true,
      message: 'Conversation history cleared.',
    });
  } catch (error) {
    console.error('[AgentController] Clear memory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear conversation history.',
    });
  }
};

module.exports = { chat, getMemory, clearMemory };
