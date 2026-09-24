import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || 'MOCK_KEY';
const HAS_KEY = apiKey !== 'MOCK_KEY';
if (!HAS_KEY) {
  console.warn('[gemini.js] GEMINI_API_KEY is not set — Gemini calls will fail and fall back to local/rule-based logic.');
}
const genAI = new GoogleGenerativeAI(apiKey);

// Google retires model names (gemini-2.0-flash now returns 404) and sometimes answers 503 "high demand".
// So we keep an ordered chain: GEMINI_MODEL (if set) first, then models verified to work with this SDK.
export const GEMINI_MODEL_CHAIN = [...new Set([process.env.GEMINI_MODEL, 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-3.8-flash'].filter(Boolean))];
const models = GEMINI_MODEL_CHAIN.map((name) => genAI.getGenerativeModel({ model: name }, { timeout: 15000 }));

/** Same surface as the SDK model (generateContent), but walks the chain if a model is retired, overloaded or slow. */
export const geminiModel = {
  async generateContent(prompt) {
    if (!HAS_KEY) throw new Error('GEMINI_API_KEY not configured');
    let lastError;
    for (let i = 0; i < models.length; i++) {
      try {
        return await models[i].generateContent(prompt);
      } catch (err) {
        lastError = err;
        console.warn(`[gemini] ${GEMINI_MODEL_CHAIN[i]} failed (HTTP ${err.status || '?'} ${err.statusText || String(err.message).slice(-80)}) — trying next model`);
      }
    }
    throw lastError;
  },
};
