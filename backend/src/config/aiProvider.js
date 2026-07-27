import { geminiModel } from './gemini.js';

// Pluggable LLM provider — the coach only escalates here for requests the local
// classifier can't confidently resolve. AI_PROVIDER=none disables external calls entirely.
const PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

export const AI_PROVIDER = PROVIDER;
export const AI_PROVIDER_ENABLED = PROVIDER !== 'none';

async function generateWithGemini(prompt) {
  const result = await geminiModel.generateContent(prompt);
  return result.response.text();
}

async function generateWithOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4
    })
  });

  if (!res.ok) {
    throw new Error(`OpenAI request failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/** Sends a prompt to whichever provider is configured (AI_PROVIDER env). Throws if none configured or the call fails — callers must have a local fallback, never assume this succeeds. */
export async function generateWithConfiguredProvider(prompt) {
  if (PROVIDER === 'none') {
    throw new Error('No AI provider configured (AI_PROVIDER=none)');
  }
  if (PROVIDER === 'openai') {
    return generateWithOpenAI(prompt);
  }
  return generateWithGemini(prompt);
}
