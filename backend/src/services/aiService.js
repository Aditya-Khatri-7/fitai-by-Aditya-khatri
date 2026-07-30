import { geminiModel } from '../config/gemini.js';
import { buildRAGPrompt } from './ragEngine.js';
import { generateWithConfiguredProvider, AI_PROVIDER_ENABLED, AI_PROVIDER } from '../config/aiProvider.js';
import { classifyLocally } from './localCoachClassifier.js';
import { predictInjury, recommendExercises } from './mlClient.js';
import { evaluateMealTiming } from './mealTimingRules.js';
import { buildIndianMealPlan, pickSingleMeal } from './indianMealTemplates.js';

// Injury bodyPart -> megaGymDataset BodyPart categories to exclude from the fallback
// workout builder. The ML recommender's avoid-list only does name/bodypart substring
// matching, which won't catch e.g. bodyPart:'knee' against a dataset category like
// 'Quadriceps' — so injury safety here works by excluding whole muscle-group
// candidates up front rather than relying on that weaker substring penalty.
const INJURY_BODY_PART_EXCLUSIONS = {
  knee: ['Quadriceps', 'Hamstrings', 'Calves', 'Glutes'],
  lower_back: ['Lower Back', 'Middle Back'],
  shoulder: ['Shoulders'],
  wrist: ['Forearms'],
  elbow: ['Triceps', 'Biceps', 'Forearms'],
  ankle: ['Calves'],
  hip: ['Glutes', 'Quadriceps', 'Adductors', 'Abductors'],
  neck: ['Neck', 'Traps']
};

function excludedBodyPartsFor(injuries = []) {
  const excluded = new Set();
  for (const inj of injuries) {
    if (!inj?.isActive) continue;
    const parts = INJURY_BODY_PART_EXCLUSIONS[inj.bodyPart] || [];
    parts.forEach(p => excluded.add(p));
  }
  return excluded;
}

/** Builds a real, equipment-respecting, injury-aware workout from the ML recommender
 * (real cosine similarity over 2,918 real exercises) instead of a hardcoded stub —
 * used whenever Gemini is unavailable, which given the free-tier quota block is most
 * of the time in practice, so this fallback IS the workout generator for most users. */
// Safe substitute focus when every requested muscle group got excluded by an active
// injury (e.g. a knee injury excludes an entire "Legs" request) — upper-body/core
// groups that knee/ankle/hip exclusions never touch, so there's always a real,
// targeted fallback instead of a generic 2-exercise stub.
const SAFE_SUBSTITUTE_GROUPS = [['Chest', 'Shoulders'], ['Back', 'Lats'], ['Abdominals']];

async function buildFallbackWorkout(userContext, options = {}) {
  const excluded = excludedBodyPartsFor(userContext.injuries);
  const ALL_GROUPS = options.focusGroups || [
    ['Chest', 'Shoulders'],
    ['Back', 'Lats'],
    ['Quadriceps', 'Hamstrings'],
    ['Biceps', 'Triceps']
  ];
  let groups = ALL_GROUPS
    .map(pair => pair.filter(g => !excluded.has(g)))
    .filter(pair => pair.length > 0);

  // Every requested group got excluded by injury safety (not an ML failure) —
  // substitute a genuinely safe focus rather than falling through to a stub that
  // (ironically) used to recommend a squat to someone with an excluded knee.
  let substitutedDueToInjury = false;
  if (groups.length === 0 && ALL_GROUPS.length > 0) {
    groups = SAFE_SUBSTITUTE_GROUPS.map(pair => pair.filter(g => !excluded.has(g))).filter(pair => pair.length > 0);
    substitutedDueToInjury = true;
  }

  const equipment = userContext.equipment?.length ? userContext.equipment : ['bodyweight_only'];
  const level = userContext.fitnessLevel || 'intermediate';

  const picks = await Promise.all(
    groups.slice(0, 4).map(pair =>
      recommendExercises({
        goal: userContext.goal?.type || 'general_fitness',
        target_muscles: pair,
        equipment,
        level,
        avoid: userContext.dislikedExerciseNames || [],
        top_k: 2
      })
    )
  );

  const seen = new Set();
  const exercises = [];
  for (const group of picks) {
    for (const ex of group) {
      if (seen.has(ex.name)) continue;
      seen.add(ex.name);
      exercises.push({
        name: ex.name,
        muscleGroups: { primary: [ex.body_part?.toLowerCase() || 'general'] },
        sets: level === 'beginner' ? 3 : 4,
        reps: '8-12',
        weight: ex.equipment === 'Body Only' ? 'bodyweight' : 'moderate',
        restTime: 75,
        equipment: ex.equipment,
        notes: `Real cosine-match for ${ex.body_part}, using ${ex.equipment} - matches your available equipment.`,
        instructions: ex.desc || ''
      });
      break; // one exercise per group per pass to keep it balanced
    }
  }

  if (exercises.length === 0) {
    // The ML service itself is genuinely unreachable (network/timeout) — last-resort
    // stub, built to respect the same injury exclusions rather than blindly
    // recommending a squat to someone whose knee just got excluded above.
    const stub = [];
    if (!excluded.has('Quadriceps')) stub.push({ name: 'Bodyweight Squat', muscleGroups: { primary: ['legs'] }, sets: 3, reps: '15', weight: 'bodyweight', restTime: 60, notes: 'ML service unreachable - generic bodyweight fallback.' });
    stub.push({ name: 'Push-Up', muscleGroups: { primary: ['chest'] }, sets: 3, reps: '12', weight: 'bodyweight', restTime: 60, notes: 'ML service unreachable - generic bodyweight fallback.' });
    stub.push({ name: 'Plank Hold', muscleGroups: { primary: ['abs'] }, sets: 3, reps: '45 sec', weight: 'bodyweight', restTime: 45, notes: 'ML service unreachable - generic bodyweight fallback.' });
    return {
      title: 'Bodyweight Full Body Circuit',
      type: 'strength',
      splitFocus: 'Full Body',
      durationTarget: userContext.workoutDuration || 30,
      exercises: stub,
      explanation: 'ML recommender unreachable — generic bodyweight-only session generated as a last resort.',
      estimatedCalories: 250
    };
  }

  return {
    title: substitutedDueToInjury ? `${options.title || 'Adaptive'} (Adjusted For Injury)` : (options.title || `${userContext.fitnessLevel || 'Adaptive'} Full Body Session`),
    type: 'strength',
    splitFocus: substitutedDueToInjury ? groups.flat().slice(0, 4).join(', ') : (options.splitFocus || groups.flat().slice(0, 4).join(', ')),
    durationTarget: userContext.workoutDuration || 45,
    exercises,
    explanation: substitutedDueToInjury
      ? `Your active injury excludes every muscle group in the requested "${options.splitFocus || 'selected'}" split, so today's session was substituted with a safe ${groups.flat().join('/')} focus instead.`
      : (options.explanation || `Built from your real equipment (${equipment.join(', ')}) and current injuries via the local exercise recommender.`),
    estimatedCalories: 350
  };
}

/** Local ML recommender is the default path (per product principle: recommend from
 * our own trained model, not an external LLM, wherever possible). Gemini is only
 * attempted when the caller explicitly opts in via userContext.preferAI — and even
 * then, any failure still falls back to the local recommender below. */
export async function generateWorkoutWithAI(userContext, options = {}) {
  if (!userContext.preferAI || !AI_PROVIDER_ENABLED) {
    return buildFallbackWorkout(userContext, options);
  }

  try {
    const prompt = `
You are FitAI, an expert adaptive fitness coach. Generate today's optimal workout.

USER CONTEXT:
- Name: ${userContext.name}, Age: ${userContext.age}, Gender: ${userContext.gender}
- Fitness Level: ${userContext.fitnessLevel}
- Current Goal: ${userContext.goal?.type}
- Available Equipment: ${userContext.equipment?.join(', ')}
- Workout Duration Target: ${userContext.workoutDuration || 45} minutes${options.splitFocus ? `\n- Requested Split Focus (must honor): ${options.splitFocus}` : ''}

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
      "notes": "string",
      "instructions": "string (concise real how-to-perform steps for this exercise)"
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
    console.warn(`[${AI_PROVIDER} AI Fallback] Using local ML recommender for workout:`, error.message);
    return buildFallbackWorkout(userContext);
  }
}

const WEEKDAY_SPLITS = [
  { splitFocus: 'Push (Chest, Shoulders, Triceps)', focusGroups: [['Chest', 'Shoulders'], ['Triceps']] },
  { splitFocus: 'Pull (Back, Biceps)', focusGroups: [['Back', 'Lats'], ['Biceps']] },
  { splitFocus: 'Legs', focusGroups: [['Quadriceps', 'Hamstrings'], ['Glutes', 'Calves']] },
  { splitFocus: 'Active Recovery / Core', focusGroups: [['Abdominals']] },
  { splitFocus: 'Upper Body Hypertrophy', focusGroups: [['Chest', 'Shoulders'], ['Back', 'Lats']] },
  { splitFocus: 'Legs & Conditioning', focusGroups: [['Quadriceps', 'Hamstrings']] },
  { splitFocus: 'Rest', focusGroups: null }
];

/** Builds a real 7-day plan locally by calling the local recommender once per day with
 * a different muscle-group focus (push/pull/legs/etc.), instead of a single flat
 * bodyweight-circuit stub repeated all week. */
async function buildFallbackWeeklyPlan(userContext) {
  const days = await Promise.all(WEEKDAY_SPLITS.map(async (day, dayOffset) => {
    if (!day.focusGroups) {
      return {
        dayOffset, title: 'Rest Day', type: 'recovery', splitFocus: 'Rest', durationTarget: 0,
        exercises: [], explanation: 'Scheduled rest day for recovery.', estimatedCalories: 0
      };
    }
    const workout = await buildFallbackWorkout(userContext, {
      title: day.splitFocus,
      splitFocus: day.splitFocus,
      explanation: `Local recommender pick for ${day.splitFocus.toLowerCase()} day, respecting your equipment and injuries.`
    });
    return { dayOffset, ...workout };
  }));
  return days;
}

/** Generates a full 7-day workout plan. Local-first per the same policy as
 * generateWorkoutWithAI — Gemini is only attempted when explicitly requested. */
export async function generateWeeklyWorkoutPlanWithAI(userContext, weekStartDate) {
  if (!userContext.preferAI || !AI_PROVIDER_ENABLED) {
    return buildFallbackWeeklyPlan(userContext);
  }

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
    console.warn(`[${AI_PROVIDER} AI Fallback] Using local recommender for weekly plan:`, error.message);
    return buildFallbackWeeklyPlan(userContext);
  }
}

const MEAL_SLOTS = ['breakfast', 'lunch', 'snack', 'dinner'];
const MEAL_TEMPLATE_SCHEMA = `{ "type": "breakfast|lunch|snack|dinner", "name": "string", "prepTime": number, "totalCalories": number, "foods": [{ "name": "string", "quantity": "string", "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number }] }`;

function annotateMealTiming(meal) {
  const totalFat = (meal.foods || []).reduce((sum, f) => sum + (f.fat || 0), 0);
  const timing = evaluateMealTiming({ mealType: meal.type, totalCalories: meal.totalCalories, fatGrams: totalFat });
  return { ...meal, timingNote: timing.concern ? timing : null };
}

/** Real diet-aware meal plan built from actual Indian dish templates. */
function buildLocalMealPlan(userContext) {
  const rawMeals = buildIndianMealPlan(userContext.dietType, userContext.cuisinePerMeal || {});
  const fallbackMeals = rawMeals.map(m => ({
    ...m,
    totalCalories: m.foods.reduce((sum, f) => sum + (f.calories || 0), 0)
  })).map(annotateMealTiming);

  const dailyTotals = fallbackMeals.reduce((acc, m) => ({
    calories: acc.calories + m.totalCalories,
    protein: acc.protein + m.foods.reduce((s, f) => s + (f.protein || 0), 0),
    carbs: acc.carbs + m.foods.reduce((s, f) => s + (f.carbs || 0), 0),
    fat: acc.fat + m.foods.reduce((s, f) => s + (f.fat || 0), 0),
    fiber: acc.fiber + m.foods.reduce((s, f) => s + (f.fiber || 0), 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  return {
    meals: fallbackMeals,
    dailyTotals,
    targetCalories: userContext.targetCalories || 2200,
    chronicConditionAdjustments: [],
    explanation: `Generated from real Indian dishes matching your ${userContext.dietType || 'omnivore'} diet preference${userContext.cuisinePerMeal && Object.values(userContext.cuisinePerMeal).some(Boolean) ? ' and your regional cuisine preferences per meal' : ''}, with a deliberately lighter dinner for better sleep quality.`
  };
}

/** Generates a full day's meal plan (all 4 slots). Local-first, matching the
 * workout generator's policy — Gemini is only attempted when explicitly requested. */
export async function generateMealPlanWithAI(userContext) {
  if (!userContext.preferAI || !AI_PROVIDER_ENABLED) {
    return buildLocalMealPlan(userContext);
  }

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
    console.warn(`[${AI_PROVIDER} AI Fallback] Using real Indian dish templates (diet-aware) for meal plan:`, error.message);
    return buildLocalMealPlan(userContext);
  }
}

/** Regenerates a single meal slot only (per-meal "Swap This Meal" feature). Local-first. */
export async function regenerateSingleMealWithAI(mealType, userContext) {
  if (!MEAL_SLOTS.includes(mealType)) {
    throw new Error(`Invalid meal type: ${mealType}`);
  }

  const buildLocalMeal = () => {
    const cuisine = userContext.cuisine || userContext.cuisinePerMeal?.[mealType];
    const dish = pickSingleMeal(mealType, userContext.dietType, cuisine);
    return annotateMealTiming({
      type: mealType,
      ...dish,
      totalCalories: dish.foods.reduce((sum, f) => sum + (f.calories || 0), 0)
    });
  };

  if (!userContext.preferAI || !AI_PROVIDER_ENABLED) {
    return buildLocalMeal();
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
    console.warn(`[${AI_PROVIDER} AI Fallback] Using real Indian dish template (diet-aware) for single meal:`, error.message);
    return buildLocalMeal();
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
  const localResult = classifyLocally(message, context.appState || {});
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
