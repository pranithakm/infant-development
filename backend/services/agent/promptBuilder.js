'use strict';

/**
 * promptBuilder.js
 * 
 * Constructs the final prompts sent to the LLM by combining:
 *   - System role instructions
 *   - Current page context
 *   - RAG-retrieved data
 *   - Tool outputs
 *   - Conversation memory
 *   - User question
 */

// ---------------------------------------------------------------------------
// System prompt — defines the AI assistant's persona
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are FirstSteps AI — an infant care expert.

RULES:
- Be crisp, clear, and short. No fluff.
- NEVER say "as an AI", "I cannot", "I'm not a doctor" or similar. Just answer.
- End medical/health answers with exactly ONE short line: "⚕️ Consult your pediatrician if symptoms persist."
- When a parent mentions a health issue (fever, cold, rash, vomiting, diarrhea, cough, etc.), give 5-6 actionable suggestions as a numbered list.
- After health suggestions, ALWAYS include a SUGGESTED_ROUTINES block with 5-6 daily routines for the next few days. Format them EXACTLY like this on separate lines:
  [SUGGESTED_ROUTINES]
  - Routine name | Short description
  - Routine name | Short description
  [/SUGGESTED_ROUTINES]
- Reference specific infant data when available (e.g., "Ayan's weight went up by 0.3kg").
- Keep responses under 200 words (excluding the routines block).
- Do NOT use markdown formatting (no **, no ##, no \`\`\`).
- Do NOT add headers or titles — just answer directly.`;

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

/**
 * Build the complete user prompt that includes all context.
 * 
 * @param {object} options
 * @param {string} options.question      - The user's question
 * @param {string} options.currentPage   - Which page the user is on
 * @param {string} options.lastAction    - Last user action (optional)
 * @param {string} options.ragContext    - Context block from ragService
 * @param {string} options.toolOutputs  - Formatted tool outputs
 * @param {string} options.memoryBlock  - Formatted conversation history
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
const buildPrompt = ({
  question,
  currentPage = '',
  lastAction = '',
  ragContext = '',
  toolOutputs = '',
  memoryBlock = '',
}) => {
  const sections = [];

  // Page context
  if (currentPage) {
    sections.push(`## Current Page\nThe user is currently on the "${currentPage}" page.`);
  }

  // Last action
  if (lastAction) {
    sections.push(`## Recent Action\nThe user recently: ${lastAction}`);
  }

  // RAG context
  if (ragContext) {
    sections.push(`## Retrieved Data\n${ragContext}`);
  }

  // Tool outputs
  if (toolOutputs) {
    sections.push(`## Analysis Results (from tools)\n${toolOutputs}`);
  }

  // Conversation memory
  if (memoryBlock) {
    sections.push(memoryBlock);
  }

  // User question (always last)
  sections.push(`## User Question\n${question}`);

  const userPrompt = sections.join('\n\n');

  return {
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
  };
};

/**
 * Format tool outputs into a readable text block.
 * 
 * @param {Array} outputs - Array of { tool, summary, data } objects
 * @returns {string}
 */
const formatToolOutputs = (outputs) => {
  if (!outputs || outputs.length === 0) return '';
  return outputs.map(o => `### ${o.tool}\n${o.summary}`).join('\n\n');
};

module.exports = { buildPrompt, formatToolOutputs, SYSTEM_PROMPT };
