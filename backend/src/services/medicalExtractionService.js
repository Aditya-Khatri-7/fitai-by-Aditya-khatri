import { generateWithConfiguredProvider, AI_PROVIDER } from '../config/aiProvider.js';

export async function extractHealthProfileFromText(freeText, priorAnswers = {}) {
  if (!freeText || freeText.trim().length < 5) {
    return { conditions: [], followUpQuestions: [], confidence: 'low', needsManualReview: true };
  }

  try {
    const prompt = `
You are a clinical intake assistant for a fitness app. Extract structured medical/injury information from the user's free-text description. Be conservative and evidence-based — do not invent conditions the text does not support.

USER TEXT: "${freeText.replace(/"/g, "'")}"
PRIOR FOLLOW-UP ANSWERS: ${JSON.stringify(priorAnswers)}

Respond in this exact JSON format, with no extra commentary:
{
  "conditions": [
    {
      "condition": "string (e.g. 'ACL Reconstruction', 'Rotator Cuff Strain', 'Hypertension')",
      "bodyPart": "string (e.g. 'knee', 'shoulder', 'lower_back', 'cardiovascular')",
      "side": "left | right | bilateral | central | systemic",
      "severity": "mild | moderate | severe",
      "painLevel": 0,
      "recoveryStage": "active | recovering | post-surgery | chronic",
      "surgeryPerformed": false,
      "doctorRestrictions": ["string"],
      "avoidExercises": ["string"],
      "recommendExercises": ["string"]
    }
  ],
  "followUpQuestions": [{ "id": "string", "question": "string" }],
  "confidence": "low | medium | high"
}
    `;

    const responseText = await generateWithConfiguredProvider(prompt);
    const cleanJSON = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJSON);
    return { ...parsed, needsManualReview: false };
  } catch (error) {
    console.warn(`[${AI_PROVIDER} AI Fallback] Medical extraction unavailable, deferring to local classifier:`, error.message);
    return { conditions: [], followUpQuestions: [], confidence: 'low', needsManualReview: true, rawText: freeText };
  }
}
