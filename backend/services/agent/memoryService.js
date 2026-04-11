'use strict';

/**
 * memoryService.js
 * 
 * Manages per-user conversation memory for the AI agent.
 * Stores the last MAX_INTERACTIONS exchanges in MongoDB so the agent
 * can maintain context continuity across requests.
 */

const AgentMemory = require('../../models/AgentMemory');

const MAX_INTERACTIONS = 5;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Save a new interaction to the user's memory.
 * Automatically trims to the last MAX_INTERACTIONS entries.
 * 
 * @param {string} userId
 * @param {object} interaction - { question, response, toolsUsed, provider, contextUsed, infantId, currentPage }
 */
const saveInteraction = async (userId, interaction) => {
  try {
    let memory = await AgentMemory.findOne({ userId });

    if (!memory) {
      memory = new AgentMemory({ userId, interactions: [] });
    }

    memory.interactions.push({
      question: interaction.question,
      response: interaction.response,
      toolsUsed: interaction.toolsUsed || [],
      provider: interaction.provider || 'unknown',
      contextUsed: interaction.contextUsed || false,
      infantId: interaction.infantId || null,
      currentPage: interaction.currentPage || '',
      timestamp: new Date(),
    });

    // Keep only the last MAX_INTERACTIONS
    if (memory.interactions.length > MAX_INTERACTIONS) {
      memory.interactions = memory.interactions.slice(-MAX_INTERACTIONS);
    }

    await memory.save();
    console.log(`[Memory] Saved interaction for user ${userId} (${memory.interactions.length}/${MAX_INTERACTIONS})`);
  } catch (err) {
    // Memory is optional — don't let failures break the agent
    console.error('[Memory] Failed to save interaction:', err.message);
  }
};

/**
 * Get recent interactions for a user.
 * 
 * @param {string} userId
 * @param {number} limit - Maximum number of interactions to return
 * @returns {Promise<Array>} Array of interaction objects
 */
const getRecentInteractions = async (userId, limit = MAX_INTERACTIONS) => {
  try {
    const memory = await AgentMemory.findOne({ userId }).lean();
    if (!memory || !memory.interactions) return [];
    return memory.interactions.slice(-limit);
  } catch (err) {
    console.error('[Memory] Failed to fetch interactions:', err.message);
    return [];
  }
};

/**
 * Clear all memory for a user.
 * 
 * @param {string} userId
 */
const clearMemory = async (userId) => {
  try {
    await AgentMemory.deleteOne({ userId });
    console.log(`[Memory] Cleared memory for user ${userId}`);
  } catch (err) {
    console.error('[Memory] Failed to clear memory:', err.message);
  }
};

/**
 * Format memory into a text block for prompt injection.
 * 
 * @param {Array} interactions - Array of interaction objects
 * @returns {string}
 */
const formatMemoryForPrompt = (interactions) => {
  if (!interactions || interactions.length === 0) return '';

  const lines = ['## Previous Conversation History'];
  interactions.forEach((entry, i) => {
    lines.push(`[${i + 1}] User: ${entry.question}`);
    // Truncate long responses to keep prompt size manageable
    const truncated = entry.response.length > 300
      ? entry.response.substring(0, 300) + '...'
      : entry.response;
    lines.push(`    Assistant: ${truncated}`);
  });
  return lines.join('\n');
};

module.exports = {
  saveInteraction,
  getRecentInteractions,
  clearMemory,
  formatMemoryForPrompt,
};
