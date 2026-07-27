import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || 'MOCK_KEY';
if (apiKey === 'MOCK_KEY') {
  console.warn('[gemini.js] GEMINI_API_KEY is not set — Gemini calls will fail and fall back to local/rule-based logic.');
}
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
