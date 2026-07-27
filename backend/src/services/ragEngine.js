import fs from 'fs';
import path from 'path';

const KNOWLEDGE_DIR = path.resolve('knowledge');

function loadJSONFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn(`[RAG Warning] Failed loading ${filePath}: ${err.message}`);
  }
  return [];
}

/**
 * Local RAG Engine: Retrieves relevant JSON knowledge snippets before calling Gemini API
 */
export function retrieveContext(query = '', category = 'all') {
  const queryLower = query.toLowerCase();
  const contextSnippets = [];

  const filesToScan = [
    { cat: 'nutrition', path: path.join(KNOWLEDGE_DIR, 'nutrition', 'indian_ifct_knowledge.json') },
    { cat: 'exercise', path: path.join(KNOWLEDGE_DIR, 'exercise', 'yoga_mobility_knowledge.json') },
    { cat: 'exercise', path: path.join(KNOWLEDGE_DIR, 'exercise', 'warmup_cooldown_knowledge.json') },
    { cat: 'rehabilitation', path: path.join(KNOWLEDGE_DIR, 'rehabilitation', 'post_surgery_rehab_knowledge.json') },
    { cat: 'mental_health', path: path.join(KNOWLEDGE_DIR, 'mental_health', 'meditation_stress_knowledge.json') },
    { cat: 'disease', path: path.join(KNOWLEDGE_DIR, 'disease', 'chronic_guidelines_knowledge.json') }
  ];

  for (const item of filesToScan) {
    if (category !== 'all' && item.cat !== category) continue;

    const data = loadJSONFile(item.path);
    for (const entry of data) {
      const entryString = JSON.stringify(entry).toLowerCase();
      // Simple keyword matching for local context retrieval
      if (
        queryLower.split(' ').some(word => word.length > 3 && entryString.includes(word)) ||
        queryLower.includes(item.cat)
      ) {
        contextSnippets.push(entry);
      }
    }
  }

  // Return top 3 matched context objects
  return contextSnippets.slice(0, 4);
}

/**
 * Builds enriched Gemini prompt with retrieved RAG context
 */
export function buildRAGPrompt(userMessage, userContext, category = 'all') {
  const retrievedSnippets = retrieveContext(userMessage, category);

  return `
You are FitAI Coach, a knowledgeable fitness AI assistant.

RETRIEVED KNOWLEDGE CONTEXT (RAG Engine):
${JSON.stringify(retrievedSnippets, null, 2)}

USER PROFILE CONTEXT:
${JSON.stringify(userContext, null, 2)}

USER QUERY:
"${userMessage}"

INSTRUCTIONS:
1. Use the RETRIEVED KNOWLEDGE CONTEXT to answer accurately with 0 hallucination.
2. Consider user's injuries, recovery, and chronic conditions.
3. Keep response concise, encouraging, and actionable.
  `;
}
