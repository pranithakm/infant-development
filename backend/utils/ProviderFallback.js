'use strict';

/**
 * showcaseProviderFallback.js
 * 
 * Fallback Chain:
 * 1. Google Gemini
 * 2. OpenAI (GPT-4o)
 * 3. Anthropic (Claude 3.5)
 * 4. Ollama (Local Llama3 for offline/privacy fallback)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

async function callGemini(fullPrompt, systemInstruction) {
  console.log('[Showcase] Attempting Gemini API...');
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini Key Missing");
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    systemInstruction 
  });
  
  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}

async function callOpenAI(fullPrompt, systemInstruction) {
  console.log('[Showcase] Attempting OpenAI API...');
  if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI Key Missing");
  
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemInstruction || 'You are a helpful assistant.' },
        { role: 'user', content: fullPrompt }
      ]
    },
    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
  );
  
  return response.data.choices[0].message.content;
}

async function callClaude(fullPrompt, systemInstruction) {
  console.log('[Showcase] Attempting Anthropic Claude API...');
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Anthropic Key Missing");
  
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1024,
      system: systemInstruction || 'You are a helpful assistant.',
      messages: [
        { role: 'user', content: fullPrompt }
      ]
    },
    { 
      headers: { 
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      } 
    }
  );
  
  return response.data.content[0].text;
}

async function callOllama(fullPrompt, systemInstruction) {
  console.log('[Showcase] Attempting Local Ollama API (Final Fallback)...');
  // Ollama default local endpoint
  const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
  
  const response = await axios.post(`${ollamaHost}/api/chat`, {
    model: 'llama3',
    messages: [
      { role: 'system', content: systemInstruction || 'You are a helpful assistant.' },
      { role: 'user', content: fullPrompt }
    ],
    stream: false
  });
  
  return response.data.message.content;
}

/**
 * Universal Generate Function with Multi-Provider Fallback Showcase
 * 
 * Flow:
 * -> Tries Gemini
 *   -> if fails, tries OpenAI
 *     -> if fails, tries Claude
 *       -> if fails, tries local Ollama
 */
async function generateWithUltimateFallback(prompt, systemInstruction = '') {
  let lastError;

  // 1. Google Gemini API
  try {
    const text = await callGemini(prompt, systemInstruction);
    return { text, provider: 'gemini' };
  } catch (err) {
    console.warn(`[Showcase] Gemini Failed: ${err.message}`);
    lastError = err;
  }

  // 2. OpenAI API
  try {
    const text = await callOpenAI(prompt, systemInstruction);
    return { text, provider: 'openai' };
  } catch (err) {
    console.warn(`[Showcase] OpenAI Failed: ${err.message}`);
    lastError = err;
  }

  // 3. Anthropic Claude API
  try {
    const text = await callClaude(prompt, systemInstruction);
    return { text, provider: 'claude' };
  } catch (err) {
    console.warn(`[Showcase] Claude Failed: ${err.message}`);
    lastError = err;
  }

  // 4. Local Ollama Instance (Final Offline Fallback)
  try {
    const text = await callOllama(prompt, systemInstruction);
    return { text, provider: 'ollama' };
  } catch (err) {
    console.error(`[Showcase] Ollama Failed: ${err.message}`);
    lastError = err;
  }

  throw new Error(`All LLM providers failed. Last Error: ${lastError.message}`);
}

module.exports = {
  generateWithUltimateFallback,
  callGemini,
  callOpenAI,
  callClaude,
  callOllama
};
