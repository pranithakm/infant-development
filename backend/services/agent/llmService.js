'use strict';

/**
 * llmService.js
 * 
 * LLM orchestration — uses Google Gemini as the primary (and only) provider.
 * 
 * Returns: { text: string, provider: 'gemini' }
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Lazy-init Gemini so the module can load even when the key is absent
let geminiModel = null;

const getGeminiModel = () => {
  if (geminiModel) return geminiModel;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const genAI = new GoogleGenerativeAI(key);
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  return geminiModel;
};

// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------

/**
 * Call Google Gemini via the official SDK.
 */
const callGemini = async (prompt, systemPrompt = '') => {
  const model = getGeminiModel();
  if (!model) throw new Error('Gemini API key not configured — set GEMINI_API_KEY in .env');

  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  const text = response.text();
  if (!text) throw new Error('Empty response from Gemini');
  return text;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a response using Gemini.
 * 
 * @param {string} prompt       - The user-facing prompt (with all context injected)
 * @param {string} systemPrompt - Optional system-level instruction
 * @returns {Promise<{ text: string, provider: string }>}
 */
const generateResponse = async (prompt, systemPrompt = '') => {
  try {
    console.log('[LLM] Calling Gemini...');
    const text = await callGemini(prompt, systemPrompt);
    console.log('[LLM] Gemini responded successfully');
    return { text, provider: 'gemini' };
  } catch (err) {
    console.error('[LLM] Gemini failed:', err.message);
    throw new Error(`LLM provider failed: ${err.message}`);
  }
};

module.exports = { generateResponse };
