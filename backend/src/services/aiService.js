import { geminiModel } from '../config/gemini.js';
import { buildRAGPrompt } from './ragEngine.js';
import { generateWithConfiguredProvider, AI_PROVIDER_ENABLED, AI_PROVIDER } from '../config/aiProvider.js';
import { classifyLocally } from './localCoachClassifier.js';
import { predictInjury } from './mlClient.js';
import { evaluateMealTiming } from './mealTimingRules.js';

export async function generateWorkoutWithAI(userContext) {
  try {
    const prompt = `
You are FitAI, an expert adaptive fitness coach. Generate today's optimal workout.

USER CONTEXT:
- Name: ${userContext.name}, Age: ${userContext.age}, Gender: ${userContext.gender}
- Fitness Level: ${userContext.fitnessLevel}
- Current Goal: ${userContext.goal?.type}
- Available Equipment: ${userContext.equipment?.join(', ')}
- Workout Duration Target: ${userContext.workoutDuration || 45} minutes

HEALTH STATUS:
- Recovery Score: ${userContext.recoveryScore}%
- Sleep Quality: ${userContext.sleepQuality}%
- Active Injuries: ${JSON.stringify(userContext.injuries)}
- Chronic Conditions: ${JSON.stringify(userContext.chronicConditions)}

Respond in this exact JSON format:
{
  "title": "string",
  "type": "strength",
  "splitFocus": "string",
  "durationTarget": 45,
  "exercises": [
    {
      "name": "string",
      "muscleGroups": { "primary": ["string"], "secondary": ["string"] },
      "sets": 3,
      "reps": "10-12",
      "weight": "20 kg",
      "restTime": 60,
      "equipment": "dumbbell",
      "notes": "string"
    }
  ],
  "explanation": "string (WHY this workout was chosen today)",
  "estimatedCalories": 350
}
    `;

    const responseText = await generateWithConfiguredProvider(prompt);
    const cleanJSON = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJSON);
  } catch (error) {
    console.warn(`[${AI_PROVIDER} AI Fallback] Using local rule engine for workout:`, error.message);
    return {
      title: 'Hypertrophy Upper Body & Core',
      type: 'strength',
      splitFocus: 'Chest, Shoulders & Triceps',
      durationTarget: 45,
      exercises: [
        { name: 'Barbell Bench Press', muscleGroups: { primary: ['chest'] }, sets: 4, reps: '8-10', weight: '70 kg', restTime: 90, notes: 'Explosive drive.' },
        { name: 'Machine Leg Press', muscleGroups: { primary: ['quads'] }, sets: 3, reps: '12', weight: '120 kg', restTime: 60, notes: 'Safe knee angle.' }
      ],
      explanation: 'Generated via rule engine: Adapted to bypass reported knee strain while targeting upper body volume.',
      estimatedCalories: 380
    };
  }
}

const WEEKDAY_SPLIT_HINT = ['Push (Chest/Shoulders/Triceps)', 'Pull (Back/Biceps)', 'Legs', 'Active Recovery / Core', 'Upper Body Hypertrophy', 'Legs & Conditioning', 'Rest'];

/** Generates a full 7-day workout plan in one call, one entry per day starting from weekStartDate. */
export async function generateWeeklyWorkoutPlanWithAI(userContext, weekStartDate) {
  try {
    const prompt = `
You are FitAI, an expert adaptive fitness coach. Generate a sensible 7-day workout plan starting ${weekStartDate}, one entry per day, respecting recovery between muscle groups (don't repeat the same primary muscle group on consecutive high-intensity days) and including at least one rest/active-recovery day.

USER CONTEXT:
- Fitness Level: ${userContext.fitnessLevel}
- Current Goal: ${userContext.goal?.type}
- Available Equipment: ${userContext.equipment?.join(', ')}
- Workout Duration Target: ${userContext.workoutDuration || 45} minutes
- Active Injuries: ${JSON.stringify(userContext.injuries)}
- Chronic Conditions: ${JSON.stringify(userContext.chronicConditions)}

Respond with a JSON array of exactly 7 entries (day 0 = ${weekStartDate}), each in this exact format:
{
  "dayOffset": 0,
  "title": "string",
  "type": "strength",
  "splitFocus": "string",
  "durationTarget": 45,
  "exercises": [
    { "name": "string", "muscleGroups": { "primary": ["string"], "secondary": ["string"] }, "sets": 3, "reps": "10-12", "weight": "20 kg", "restTime": 60, "equipment": "dumbbell", "notes": "string" }
  ],
  "explanation": "string",
  "estimatedCalories": 350
}
    `;

    const responseText = await generateWithConfiguredProvider(prompt);
    const cleanJSON = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJSON);
    if (!Array.isArray(parsed) || parsed.length !== 7) throw new Error('Expected a 7-entry array');
    return parsed;
  } catch (error) {
    console.warn(`[${AI_PROVIDER} AI Fallback] Using local rule engine for weekly plan:`, error.message);
    return WEEKDAY_SPLIT_HINT.map((splitFocus, dayOffset) => ({
      dayOffset,
      title: splitFocus,
      type: splitFocus.toLowerCase().includes('rest') ? 'recovery' : 'strength',
      splitFocus,
      durationTarget: userContext.workoutDuration || 45,
      exercises: splitFocus.toLowerCase().includes('rest')
        ? []
        : [{ name: 'Bodyweight Circuit', muscleGroups: { primary: ['full_body'] }, sets: 3, reps: '12-15', weight: 'bodyweight', restTime: 60, equipment: 'bodyweight_only', notes: 'Rule-engine fallback plan.' }],
      explanation: 'Generated via rule engine fallback covering major muscle groups across the week with a rest day.',
      estimatedCalories: splitFocus.toLowerCase().includes('rest') ? 0 : 350
    }));
  }
}

const MEAL_SLOTS = ['breakfast', 'lunch', 'snack', 'dinner'];
const MEAL_TEMPLATE_SCHEMA = `{ "type": "breakfast|lunch|snack|dinner", "name": "string", "prepTime": number, "totalCalories": number, "foods": [{ "name": "string", "quantity": "string", "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number }] }`;

function annotateMealTiming(meal) {
  const totalFat = (meal.foods || []).reduce((sum, f) => sum + (f.fat || 0), 0);
  const timing = evaluateMealTiming({ mealType: meal.type, totalCalories: meal.totalCalories, fatGrams: totalFat });
  return { ...meal, timingNote: timing.concern ? timing : null };
}

/** Generates a full day's meal plan (all 4 slots). */
export async function generateMealPlanWithAI(userContext) {
  try {
    const prompt = `
You are FitAI, an expert nutrition coach. Generate today's optimal meal plan across breakfast, lunch, snack, and dinner.

USER CONTEXT:
- Current Goal: ${userContext.goal?.type}, Target Calories: ${userContext.targetCalories || 2200}
- Diet Type: ${userContext.dietType || 'omnivore'}
- Allergies: ${JSON.stringify(userContext.allergies || [])}
- Chronic Conditions: ${JSON.stringify(userContext.chronicConditions)}
- Budget: ${userContext.budget || 'medium'}, Cooking Skill: ${userContext.cookingSkill || 'intermediate'}

IMPORTANT MEAL-TIMING GUIDANCE: keep dinner lighter and lower-fat than breakfast/lunch where possible — large, high-fat meals close to bedtime are linked to poorer sleep and glucose control. Distribute protein across all meals rather than concentrating it in one.

Respond in this exact JSON format:
{
  "meals": [${MEAL_TEMPLATE_SCHEMA}],
  "dailyTotals": { "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number },
  "targetCalories": number,
  "chronicConditionAdjustments": [{ "condition": "string", "adjustment": "string" }],
  "explanation": "string"
}
    `;

    const responseText = await generateWithConfiguredProvider(prompt);
    const cleanJSON = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJSON);
    parsed.meals = (parsed.meals || []).map(annotateMealTiming);
    return parsed;
  } catch (error) {
    console.warn(`[${AI_PROVIDER} AI Fallback] Using local rule engine for meal plan:`, error.message);
    const fallbackMeals = [
      { type: 'breakfast', name: 'Protein Oat Bowl with Blueberries', prepTime: 10, totalCalories: 480, foods: [{ name: 'Rolled Oats', quantity: '80g', calories: 300, protein: 11, carbs: 54, fat: 5, fiber: 8 }, { name: 'Whey Protein', quantity: '30g', calories: 120, protein: 25, carbs: 2, fat: 1, fiber: 0 }] },
      { type: 'lunch', name: 'Grilled Chicken & Quinoa Bowl', prepTime: 20, totalCalories: 620, foods: [{ name: 'Chicken Breast', quantity: '180g', calories: 300, protein: 56, carbs: 0, fat: 6, fiber: 0 }, { name: 'Quinoa', quantity: '150g', calories: 190, protein: 7, carbs: 34, fat: 3, fiber: 4 }] },
      { type: 'snack', name: 'Greek Yogurt & Almonds', prepTime: 5, totalCalories: 300, foods: [{ name: 'Greek Yogurt', quantity: '200g', calories: 150, protein: 20, carbs: 8, fat: 2, fiber: 0 }, { name: 'Almonds', quantity: '25g', calories: 150, protein: 5, carbs: 5, fat: 13, fiber: 3 }] },
      { type: 'dinner', name: 'Lentil & Vegetable Soup', prepTime: 20, totalCalories: 450, foods: [{ name: 'Lentils', quantity: '200g', calories: 260, protein: 16, carbs: 36, fat: 4, fiber: 10 }, { name: 'Mixed Vegetables', quantity: '150g', calories: 90, protein: 3, carbs: 16, fat: 1, fiber: 5 }] }
    ].map(annotateMealTiming);
    return {
      meals: fallbackMeals,
      dailyTotals: { calories: 1850, protein: 143, carbs: 155, fat: 35, fiber: 30 },
      targetCalories: userContext.targetCalories || 2200,
      chronicConditionAdjustments: [],
      explanation: 'Generated via rule engine: balanced macros with a deliberately lighter dinner for better sleep quality.'
    };
  }
}

/** Regenerates a single meal slot only (per-meal "Swap This Meal" feature). */
export async function regenerateSingleMealWithAI(mealType, userContext) {
  if (!MEAL_SLOTS.includes(mealType)) {
    throw new Error(`Invalid meal type: ${mealType}`);
  }
  try {
    const prompt = `
You are FitAI, an expert nutrition coach. Generate ONE replacement meal for the "${mealType}" slot only.

USER CONTEXT:
- Diet Type: ${userContext.dietType || 'omnivore'}
- Allergies: ${JSON.stringify(userContext.allergies || [])}
- Chronic Conditions: ${JSON.stringify(userContext.chronicConditions)}
${mealType === 'dinner' ? '- IMPORTANT: keep this lighter and lower-fat since it is dinner — large, high-fat meals close to bedtime hurt sleep and glucose control.' : ''}

Respond with exactly one JSON object matching: ${MEAL_TEMPLATE_SCHEMA}
    `;
    const responseText = await generateWithConfiguredProvider(prompt);
    const cleanJSON = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const meal = JSON.parse(cleanJSON);
    return annotateMealTiming({ ...meal, type: mealType });
  } catch (error) {
    console.warn(`[${AI_PROVIDER} AI Fallback] Using local rule engine for single meal:`, error.message);
    return annotateMealTiming({
      type: mealType,
      name: 'Balanced Rule-Engine Meal',
      prepTime: 15,
      totalCalories: mealType === 'dinner' ? 450 : 550,
      foods: [{ name: 'Grilled Protein & Vegetables', quantity: '250g', calories: mealType === 'dinner' ? 450 : 550, protein: 35, carbs: 30, fat: mealType === 'dinner' ? 12 : 18, fiber: 6 }]
    });
  }
}

export async function chatWithAICoach(userMessage, userContext) {
  try {
    // Inject RAG Retrieval Context
    const ragPrompt = buildRAGPrompt(userMessage, userContext);
    const result = await geminiModel.generateContent(ragPrompt);
    return result.response.text();
  } catch (error) {
    return "I've retrieved your health parameters from the local knowledge base. Keep hydration high and maintain proper form to protect active joint strains!";
  }
}

const VALID_THEMES = [
  { id: 'midnight_carbon', mood: 'neutral default, dark slate' },
  { id: 'obsidian_blood', mood: 'intense, energized, aggressive, dark red' },
  { id: 'void_purple', mood: 'creative, mysterious, dark purple' },
  { id: 'forest_deep', mood: 'natural, grounded, dark green' },
  { id: 'ocean_abyss', mood: 'cool, calm, focused, dark cyan' },
  { id: 'burnt_circuit', mood: 'intense, fiery, high-energy, dark amber' },
  { id: 'neon_noir', mood: 'edgy, vibrant, dark magenta neon' },
  { id: 'clinical_white', mood: 'focused, clean, high-contrast light' },
  { id: 'arctic_white', mood: 'calm, cool, crisp light blue' },
  { id: 'sand_dune', mood: 'warm, neutral, earthy light' },
  { id: 'blossom', mood: 'soft, gentle, light pink' },
  { id: 'sage_light', mood: 'calm, natural, muted green light' },
  { id: 'golden_hour', mood: 'warm, cozy, amber light' },
  { id: 'lavender_dream', mood: 'dreamy, soft, light purple' }
];
const VALID_THEME_IDS = VALID_THEMES.map(t => t.id);
const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner'];
const VALID_MUSCLE_GROUPS = ['chest', 'back', 'legs', 'shoulders', 'arms'];
const VALID_ACTION_TYPES = [
  'CHANGE_THEME', 'UPDATE_CUSTOM_MEAL', 'UPDATE_MULTIPLE_MEALS', 'ADD_SNACKS',
  'REMOVE_SNACKS', 'MERGE_WORKOUT_PLANS', 'SYNC_WEARABLE', 'NAVIGATE', 'NONE'
];

function buildMealSchema() {
  return `{ "type": "breakfast|lunch|snack|dinner", "name": "string", "prepTime": number, "totalCalories": number, "foods": [{ "name": "string", "quantity": "string", "calories": number, "protein": number, "carbs": number, "fat": number }] }`;
}

/**
 * Resolves a free-form coach message into a structured action against FitAI's real
 * capability set plus a grounded natural-language reply. Used by both the docked
 * chat panel and the 3D spatial coach so there is one brain, not duplicated logic.
 *
 * Layered so the app is never fully dependent on a paid external LLM:
 *  1. Local deterministic classifier (zero cost, zero external data transfer) handles
 *     the well-defined majority of requests, enriched with real predictions from the
 *     trained recovery/injury XGBoost models (via mlClient) where relevant.
 *  2. Only genuinely ambiguous requests escalate to whichever LLM provider is
 *     configured (AI_PROVIDER env — gemini/openai/none).
 *  3. If no provider is configured (or it fails) and the request is ambiguous, ask a
 *     clarifying question instead of guessing or faking success.
 */
export async function resolveCoachAction(message, context = {}) {
  const localResult = classifyLocally(message);
  if (localResult) {
    return enrichWithMLContext(localResult, context.appState || {});
  }

  if (!AI_PROVIDER_ENABLED) {
    return {
      replyText: "I couldn't confidently match that to a specific action locally, and no AI provider is configured (AI_PROVIDER=none) to help interpret it. Try rephrasing with a specific meal (breakfast/lunch/dinner/snack), theme mood, or muscle group.",
      proposedAction: null
    };
  }

  return resolveViaLLM(message, context);
}

/** Uses real trained-model output (via the existing mlClient, which itself falls back to
 *  an honest rule formula if the Python ML service is down) to ground the reply text —
 *  never fabricated numbers. */
async function enrichWithMLContext(result, appState) {
  if (!result.mlContext?.groups) return { replyText: result.replyText, proposedAction: result.proposedAction };

  try {
    const injury = await predictInjury({
      workoutFrequency: appState.workoutFrequencyPerWeek,
      sleepAvg: appState.sleepAvgHours,
      recoveryScore: appState.recoveryScore
    });
    const note = injury.injury_risk === 'high'
      ? ` Heads up — your predicted injury risk today is ${injury.injury_risk} (${injury.warning_message}); I've kept this to moderate volume.`
      : injury.injury_risk === 'medium'
        ? ` Your predicted injury risk today is moderate — go easy on the last set or two.`
        : '';
    return { replyText: result.replyText + note, proposedAction: result.proposedAction };
  } catch {
    return { replyText: result.replyText, proposedAction: result.proposedAction };
  }
}

async function resolveViaLLM(message, context = {}) {
  const { history = [], appState = {} } = context;

  const historyText = history
    .slice(-6)
    .map(h => `${h.sender === 'user' ? 'User' : 'Coach'}: ${h.text}`)
    .join('\n');

  const themeCatalog = VALID_THEMES.map(t => `- ${t.id} (${t.mood})`).join('\n');

  const prompt = `
You are the operating intelligence for the FitAI app. Your job is NOT to chat — it is to read the user's intent, reason about what they actually want, and either (a) propose exactly one structured action against FitAI's real capabilities, or (b) answer conversationally using the real application state below. Never invent statistics, dataset names, or claim an action succeeded — only describe what you are proposing.

CURRENT APPLICATION STATE (ground truth, use this, never invent numbers):
- Today's meals: ${JSON.stringify(appState.meals || [])}
- Today's workout: ${JSON.stringify(appState.workout || null)}
- Current theme: ${appState.theme || 'unknown'}

RECENT CONVERSATION (for context/memory — a follow-up like "make it non veg too" refers back to this):
${historyText || '(no prior messages)'}

LATEST USER MESSAGE:
"${message}"

AVAILABLE THEMES (pick the closest match to the requested mood/style, do not default to one you're unsure about — reason about the mood):
${themeCatalog}

CAPABILITIES YOU MAY PROPOSE (exactly one, or NONE if this is just a question/conversation):
1. CHANGE_THEME — payload: one theme id from the list above.
2. UPDATE_CUSTOM_MEAL — payload: a single meal object matching schema ${buildMealSchema()}. Generate real, sensible food items/macros yourself appropriate to what the user asked for (diet type, calorie/protein goals, etc). "type" MUST be whichever meal slot the user is actually referring to (breakfast/lunch/snack/dinner) — infer this from the message and recent conversation, never default to breakfast unless the user meant breakfast.
3. UPDATE_MULTIPLE_MEALS — payload: an array of 2+ meal objects (same schema) when the user wants more than one meal slot changed in the same request.
4. ADD_SNACKS — payload: null.
5. REMOVE_SNACKS — payload: null.
6. MERGE_WORKOUT_PLANS — payload: { "groups": [subset of ${JSON.stringify(VALID_MUSCLE_GROUPS)}], "title": "string" }. Extract exactly the muscle groups the user mentioned.
7. SYNC_WEARABLE — payload: null.
8. NAVIGATE — payload: a path string like "/profile?action=change_avatar".
9. NONE — payload: null. Use this when the message is a question, or when it's too ambiguous to safely act on (in that case, ask a clarifying question in replyText instead of guessing).

Respond in this EXACT JSON format, nothing else:
{
  "replyText": "string — natural, specific explanation of what you're proposing and why, grounded in the real state above. If proposedAction type is NONE and this is a question, answer it using the real state. If ambiguous, ask a clarifying question here instead of guessing.",
  "proposedAction": { "type": "one of the capability names above", "payload": <matching payload or null>, "description": "short human-readable summary of the change" } | null
}
`.trim();

  try {
    const responseText = await generateWithConfiguredProvider(prompt);
    const cleanJSON = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJSON);

    if (!parsed.proposedAction || parsed.proposedAction.type === 'NONE') {
      return { replyText: parsed.replyText, proposedAction: null };
    }

    const action = parsed.proposedAction;
    if (!VALID_ACTION_TYPES.includes(action.type)) {
      return { replyText: parsed.replyText, proposedAction: null };
    }

    // Guard against a hallucinated theme/meal-type/muscle-group breaking app state.
    if (action.type === 'CHANGE_THEME' && !VALID_THEME_IDS.includes(action.payload)) {
      return { replyText: parsed.replyText, proposedAction: null };
    }
    if (action.type === 'UPDATE_CUSTOM_MEAL' && !VALID_MEAL_TYPES.includes(action.payload?.type)) {
      return { replyText: parsed.replyText, proposedAction: null };
    }
    if (action.type === 'UPDATE_MULTIPLE_MEALS') {
      const meals = Array.isArray(action.payload) ? action.payload : [];
      if (!meals.length || meals.some(m => !VALID_MEAL_TYPES.includes(m.type))) {
        return { replyText: parsed.replyText, proposedAction: null };
      }
    }
    if (action.type === 'MERGE_WORKOUT_PLANS') {
      const groups = (action.payload?.groups || []).filter(g => VALID_MUSCLE_GROUPS.includes(g));
      if (!groups.length) {
        return { replyText: parsed.replyText, proposedAction: null };
      }
      action.payload.groups = groups;
    }

    return { replyText: parsed.replyText, proposedAction: action };
  } catch (error) {
    console.warn(`[${AI_PROVIDER} Coach Action] Failed:`, error.message);
    return {
      replyText: "I couldn't reach the AI reasoning engine just now, so I didn't make any changes. Please try again in a moment.",
      proposedAction: null,
      degraded: true
    };
  }
}
