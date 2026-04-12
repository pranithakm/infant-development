'use strict';

/**
 * agentService.js
 * 
 * The core brain of the Agentic AI system.
 * 
 * Orchestration flow:
 *   1. Receive request context (infantId, question, currentPage, lastAction, userId)
 *   2. Classify the user's intent via keyword analysis
 *   3. Fetch RAG context from MongoDB
 *   4. Run relevant tools for structured analysis
 *   5. Retrieve conversation memory for continuity
 *   6. Build the final prompt
 *   7. Call the LLM (Gemini)
 *   8. Detect navigation intent
 *   9. Save interaction to memory
 *  10. Return structured response (with optional navigateTo)
 */

const ragService = require('./ragService');
const toolService = require('./toolService');
const memoryService = require('./memoryService');
const promptBuilder = require('./promptBuilder');
const llmService = require('./llmService');

// ---------------------------------------------------------------------------
// Intent classification
// ---------------------------------------------------------------------------

/**
 * Simple keyword-based intent classifier.
 * Returns one of: 'tool', 'rag_llm', 'rag_summary', 'general'
 * 
 * - 'tool'        → question asks for structured analysis (trends, data)
 * - 'rag_llm'     → question asks for advice/reasoning with context
 * - 'rag_summary' → question asks to see raw data
 * - 'general'     → open-ended question, use LLM with minimal context
 */
const classifyIntent = (question) => {
  const q = (question || '').toLowerCase();

  // Structured analysis keywords → run tools + LLM
  if (/trend|analysis|analyse|analyze|compare|statistics|stats|chart/i.test(q)) {
    return 'tool';
  }

  // Advice / reasoning keywords → RAG + LLM
  if (/why|advice|should|recommend|suggest|help|concern|worried|normal|how\s+(to|can|do)/i.test(q)) {
    return 'rag_llm';
  }

  // Data request keywords → RAG summary (still goes through LLM for formatting)
  if (/show|list|data|detail|what\s+is|tell\s+me\s+about|status|info|information/i.test(q)) {
    return 'rag_summary';
  }

  // Default: general chat with context
  return 'general';
};

// ---------------------------------------------------------------------------
// Navigation detection
// ---------------------------------------------------------------------------

/**
 * Route map — maps keywords in the user query to frontend page routes.
 * If an infantId is available, routes include the infant-specific path.
 */
const NAVIGATION_PATTERNS = [
  { keywords: /\b(scheme|schemes|government|benefits|subsidy|subsidies)\b/i,       route: '/dashboard/schemes',                    infantRoute: null },
  { keywords: /\b(routine|routines|daily routine|schedule)\b/i,                    route: '/dashboard',                            infantRoute: '/dashboard/infants/{id}/tracker' },
  { keywords: /\b(growth|weight|height|head circumference|measurements?)\b/i,      route: '/dashboard',                            infantRoute: '/dashboard/infants/{id}/growth' },
  { keywords: /\b(milestone|milestones|development|developmental)\b/i,             route: '/dashboard',                            infantRoute: '/dashboard/infants/{id}/milestones' },
  { keywords: /\b(insight|insights|ai insight|ai analysis)\b/i,                    route: '/dashboard',                            infantRoute: '/dashboard/infants/{id}/insights' },
  { keywords: /\b(calendar|schedule|dates?)\b/i,                                   route: '/dashboard',                            infantRoute: '/dashboard/infants/{id}/calendar' },
  { keywords: /\b(progress|report|summary|overview)\b/i,                           route: '/dashboard',                            infantRoute: '/dashboard/infants/{id}/progress' },
  { keywords: /\b(infant|baby|child|profile|infants)\b/i,                          route: '/dashboard',                            infantRoute: '/dashboard/infants/{id}' },
  { keywords: /\b(dashboard|home|main)\b/i,                                        route: '/dashboard',                            infantRoute: null },
];

/**
 * Detect if the user query mentions a page-related keyword.
 * Any mention of growth, routines, schemes, etc. will return a navigateTo URL.
 * 
 * @param {string} question - User's question
 * @param {string|null} infantId - Selected infant ID
 * @returns {string|null} URL to navigate to, or null
 */
const detectNavigation = (question, infantId) => {
  const q = (question || '').toLowerCase();

  for (const pattern of NAVIGATION_PATTERNS) {
    if (pattern.keywords.test(q)) {
      // Prefer infant-specific route if infant is selected and route exists
      if (infantId && pattern.infantRoute) {
        return pattern.infantRoute.replace('{id}', infantId);
      }
      return pattern.route;
    }
  }

  return null;
};

// ---------------------------------------------------------------------------
// Main agent function
// ---------------------------------------------------------------------------

/**
 * Process a user query through the full agent pipeline.
 * 
 * @param {object} params
 * @param {string} params.userId       - Authenticated user's ID
 * @param {string} params.infantId     - Selected infant ID (optional)
 * @param {string} params.question     - User's question
 * @param {string} params.currentPage  - Current page name
 * @param {string} params.lastAction   - Last user action (optional)
 * @returns {Promise<{ response: string, provider: string, toolsUsed: string[], contextUsed: boolean }>}
 */
const processQuery = async ({ userId, infantId, question, currentPage, lastAction }) => {
  console.log(`[Agent] Processing query from user ${userId}: "${question.substring(0, 80)}..."`);

  // 1. Classify intent
  const intent = classifyIntent(question);
  console.log(`[Agent] Intent: ${intent}`);

  // 2. Build RAG context
  let ragContext = '';
  let contextUsed = false;
  try {
    const { contextText } = await ragService.buildContext(infantId || null);
    ragContext = contextText;
    contextUsed = !!ragContext && ragContext.length > 20;
    console.log(`[Agent] RAG context: ${ragContext.length} chars`);
  } catch (err) {
    console.warn('[Agent] RAG failed, proceeding without context:', err.message);
  }

  // 3. Run tools (for 'tool' intent, or if keywords match)
  let toolsUsed = [];
  let toolOutputsText = '';
  if (intent === 'tool' || intent === 'rag_llm' || intent === 'rag_summary') {
    try {
      const toolResult = await toolService.runRelevantTools(question, {
        infantId: infantId || null,
      });
      toolsUsed = toolResult.toolsUsed;
      toolOutputsText = promptBuilder.formatToolOutputs(toolResult.outputs);
      console.log(`[Agent] Tools used: ${toolsUsed.join(', ') || 'none'}`);
    } catch (err) {
      console.warn('[Agent] Tool execution failed:', err.message);
    }
  }

  // 4. Retrieve conversation memory
  let memoryBlock = '';
  try {
    const recentInteractions = await memoryService.getRecentInteractions(userId, undefined, infantId || null);
    memoryBlock = memoryService.formatMemoryForPrompt(recentInteractions);
  } catch (err) {
    console.warn('[Agent] Memory retrieval failed:', err.message);
  }

  // 5. Build prompt
  const { systemPrompt, userPrompt } = promptBuilder.buildPrompt({
    question,
    currentPage,
    lastAction,
    ragContext,
    toolOutputs: toolOutputsText,
    memoryBlock,
  });

  // 6. Call LLM
  let response = '';
  let provider = 'unknown';
  try {
    const llmResult = await llmService.generateResponse(userPrompt, systemPrompt);
    response = llmResult.text;
    provider = llmResult.provider;
  } catch (err) {
    console.error('[Agent] All LLMs failed:', err.message);
    response = 'Sorry, unable to respond right now. Please try again.';
    provider = 'none';
  }

  // 7. Parse suggested routines from LLM response
  const suggestedRoutines = parseSuggestedRoutines(response);
  // Strip the [SUGGESTED_ROUTINES] block from the visible response
  const cleanResponse = response
    .replace(/\[SUGGESTED_ROUTINES\][\s\S]*?\[\/SUGGESTED_ROUTINES\]/g, '')
    .trim();

  // 8. Save to memory (async, don't block response)
  memoryService.saveInteraction(userId, {
    question,
    response: cleanResponse,
    toolsUsed,
    provider,
    contextUsed,
    infantId: infantId || null,
    currentPage,
  }).catch(err => console.error('[Agent] Memory save failed:', err.message));

  // 9. Detect navigation intent
  const navigateTo = detectNavigation(question, infantId);
  if (navigateTo) {
    console.log(`[Agent] Navigation detected: ${navigateTo}`);
  }

  // 10. Return structured response
  return {
    response: cleanResponse,
    provider,
    toolsUsed,
    contextUsed,
    navigateTo,
    suggestedRoutines,
  };
};

// ---------------------------------------------------------------------------
// Parse suggested routines from LLM response
// ---------------------------------------------------------------------------

/**
 * Extract suggested routines from the [SUGGESTED_ROUTINES] block.
 * Returns an array of { name, description } objects.
 * 
 * @param {string} text - Raw LLM response
 * @returns {Array<{ name: string, description: string }>}
 */
const parseSuggestedRoutines = (text) => {
  const match = text.match(/\[SUGGESTED_ROUTINES\]([\s\S]*?)\[\/SUGGESTED_ROUTINES\]/);
  if (!match) return [];

  const lines = match[1].trim().split('\n');
  const routines = [];
  for (const line of lines) {
    const cleaned = line.replace(/^[\s\-•]+/, '').trim();
    if (!cleaned) continue;
    const parts = cleaned.split('|');
    routines.push({
      name: (parts[0] || '').trim(),
      description: (parts[1] || '').trim(),
    });
  }
  return routines;
};

module.exports = { processQuery, classifyIntent, detectNavigation };
