'use strict';

/**
 * Try several Gemini model names in order when one fails (quota, 503, unknown model, etc.).
 * Override order with env: GEMINI_MODEL_FALLBACK="gemini-2.5-flash,gemini-2.0-flash"
 */

const DEFAULT_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

function parseModelChainFromEnv() {
  const raw = process.env.GEMINI_MODEL_FALLBACK;
  if (!raw || !String(raw).trim()) return null;
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function getModelChain() {
  return parseModelChainFromEnv() || DEFAULT_MODELS;
}

function isTransientGeminiError(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('resource exhausted') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('socket hang up')
  );
}

/**
 * @param {import('@google/generative-ai').GoogleGenerativeAI} genAI
 * @param {{ userPrompt: string, systemInstruction?: string, maxRetriesPerModel?: number }} opts
 * @returns {Promise<string>}
 */
async function generateTextWithModelFallback(genAI, opts) {
  const { userPrompt, systemInstruction, maxRetriesPerModel = 3 } = opts;
  const chain = getModelChain();
  let lastErr;

  for (const modelName of chain) {
    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        const cfg = { model: modelName };
        if (systemInstruction) cfg.systemInstruction = systemInstruction;
        const model = genAI.getGenerativeModel(cfg);
        const result = await model.generateContent(userPrompt);
        const text = result.response.text();
        if (modelName !== chain[0]) {
          console.log(`[Gemini] Succeeded with fallback model: ${modelName}`);
        }
        return text;
      } catch (err) {
        lastErr = err;
        const transient = isTransientGeminiError(err);
        if (transient && attempt < maxRetriesPerModel) {
          console.log(
            `[Gemini] ${modelName} attempt ${attempt}/${maxRetriesPerModel} transient: ${err.message}`
          );
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        console.warn(`[Gemini] Model "${modelName}" failed (${err.message}) — trying next model if any.`);
        break;
      }
    }
  }

  throw lastErr;
}

module.exports = {
  generateTextWithModelFallback,
  getModelChain,
  DEFAULT_MODELS,
};
