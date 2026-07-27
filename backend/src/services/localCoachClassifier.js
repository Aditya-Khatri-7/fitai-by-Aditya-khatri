/**
 * Deterministic, zero-dependency, zero-external-call classifier for the AI coach.
 * This is the PRIMARY path: it handles the common, well-defined requests entirely
 * locally (no tokens spent, no data sent to any third party). Only genuinely
 * ambiguous or open-ended requests fall through to an optional LLM provider.
 *
 * This replaces the old client-side regex engine (frontend/src/utils/aiIntentEngine.js,
 * deleted) which had two real bugs: it hardcoded meal payloads to type:'breakfast'
 * regardless of what the user asked, and only ever reached 4 of the app's 14 themes.
 * This version always binds to the meal/theme the user actually meant.
 */

const VALID_THEME_IDS = [
  'midnight_carbon', 'obsidian_blood', 'void_purple', 'forest_deep', 'ocean_abyss',
  'burnt_circuit', 'neon_noir', 'clinical_white', 'arctic_white', 'sand_dune',
  'blossom', 'sage_light', 'golden_hour', 'lavender_dream'
];

const THEME_SYNONYMS = {
  midnight_carbon: ['default', 'neutral', 'standard', 'slate'],
  obsidian_blood: ['intense', 'aggressive', 'power', 'fierce', 'blood', 'angry'],
  void_purple: ['creative', 'mysterious', 'artsy', 'purple', 'imaginative'],
  forest_deep: ['natural', 'nature', 'earthy', 'green', 'grounded', 'organic', 'forest'],
  ocean_abyss: ['cool', 'calm', 'focused', 'ocean', 'cyan', 'soothing', 'chill', 'relax', 'relaxing', 'peaceful', 'mood'],
  burnt_circuit: ['fiery', 'energetic', 'amber', 'circuit', 'hype'],
  neon_noir: ['edgy', 'vibrant', 'neon', 'club', 'magenta'],
  clinical_white: ['clean', 'minimal', 'professional', 'clinical'],
  arctic_white: ['crisp', 'arctic', 'icy', 'fresh'],
  sand_dune: ['desert', 'beige', 'dune'],
  blossom: ['soft', 'gentle', 'pink', 'delicate', 'romantic'],
  sage_light: ['sage', 'muted green'],
  golden_hour: ['cozy', 'warm', 'sunset', 'golden', 'amber light'],
  lavender_dream: ['dreamy', 'lavender', 'whimsical', 'soft purple']
};
// 'light'/'white'/'dark'/'bright' need explicit dark-vs-light disambiguation, handled separately below.

const MEAL_SLOT_WORDS = {
  breakfast: ['breakfast'],
  lunch: ['lunch'],
  dinner: ['dinner', 'supper'],
  snack: ['snack', 'snacks']
};

const DIET_WORDS = {
  vegan: ['vegan'],
  vegetarian: ['veg', 'vegetarian', 'paneer', 'tofu'],
  nonveg: ['nonveg', 'non-veg', 'non veg', 'chicken', 'egg', 'eggs', 'meat', 'turkey', 'fish', 'bacon']
};

const LIGHTER_WORDS = ['light', 'lighter', 'low cal', 'low-cal', 'fewer calories', 'less calories', 'smaller'];

const MUSCLE_GROUP_WORDS = {
  chest: ['chest'],
  back: ['back', 'lat', 'lats'],
  legs: ['leg', 'legs', 'quad', 'quads', 'hamstring', 'glute', 'glutes'],
  shoulders: ['shoulder', 'shoulders'],
  arms: ['arm', 'arms', 'bicep', 'biceps', 'tricep', 'triceps']
};

const wordBoundary = (text, word) => new RegExp(`\\b${word.replace(/[-]/g, '[- ]?')}\\b`, 'i').test(text);
const anyWordHit = (text, words) => words.filter(w => wordBoundary(text, w));

// A modest but real meal template library — food/macro content, not the same two
// hardcoded meals reused for every request regardless of what was asked.
const MEAL_TEMPLATES = {
  breakfast: {
    vegetarian: { name: 'High-Protein Vegetarian Breakfast Bowl', prepTime: 12, totalCalories: 620, foods: [
      { name: 'Paneer & Sprouted Moong Chilla', quantity: '180g', calories: 260, protein: 22, carbs: 24, fat: 8 },
      { name: 'Greek Yogurt with Honey', quantity: '150g', calories: 150, protein: 18, carbs: 12, fat: 2 },
      { name: 'Whole Wheat Toast & Almond Butter', quantity: '1 slice', calories: 210, protein: 6, carbs: 22, fat: 9 }
    ]},
    nonveg: { name: 'Power Athlete Non-Veg Breakfast', prepTime: 12, totalCalories: 640, foods: [
      { name: 'Scrambled Eggs & Egg Whites', quantity: '4 large', calories: 210, protein: 30, carbs: 2, fat: 8 },
      { name: 'Grilled Turkey Bacon', quantity: '3 strips', calories: 140, protein: 18, carbs: 1, fat: 7 },
      { name: 'Whole Grain Sourdough Toast', quantity: '2 slices', calories: 200, protein: 9, carbs: 36, fat: 2 }
    ]},
    vegan: { name: 'Plant-Powered Breakfast Bowl', prepTime: 10, totalCalories: 560, foods: [
      { name: 'Overnight Oats with Soy Milk & Chia', quantity: '250g', calories: 320, protein: 14, carbs: 46, fat: 9 },
      { name: 'Almond Butter & Banana', quantity: '1 tbsp + 1 fruit', calories: 240, protein: 6, carbs: 30, fat: 12 }
    ]}
  },
  lunch: {
    vegetarian: { name: 'Grilled Tofu & Paneer Mediterranean Bowl', prepTime: 18, totalCalories: 680, foods: [
      { name: 'Marinated Grilled Tofu & Paneer', quantity: '220g', calories: 340, protein: 32, carbs: 6, fat: 20 },
      { name: 'Steamed Herb Quinoa', quantity: '180g', calories: 220, protein: 8, carbs: 39, fat: 4 },
      { name: 'Roasted Vegetables', quantity: '150g', calories: 120, protein: 2, carbs: 10, fat: 9 }
    ]},
    nonveg: { name: 'Grilled Chicken & Quinoa Bowl', prepTime: 20, totalCalories: 720, foods: [
      { name: 'Grilled Chicken Breast', quantity: '200g', calories: 330, protein: 62, carbs: 0, fat: 7 },
      { name: 'Cooked Quinoa', quantity: '180g', calories: 220, protein: 8, carbs: 39, fat: 4 },
      { name: 'Olive Oil Roasted Vegetables', quantity: '150g', calories: 170, protein: 2, carbs: 12, fat: 14 }
    ]},
    vegan: { name: 'Chickpea & Roasted Vegetable Bowl', prepTime: 15, totalCalories: 610, foods: [
      { name: 'Spiced Chickpeas', quantity: '200g', calories: 280, protein: 15, carbs: 40, fat: 6 },
      { name: 'Brown Rice', quantity: '150g', calories: 190, protein: 4, carbs: 40, fat: 1 },
      { name: 'Roasted Vegetables & Tahini', quantity: '150g', calories: 140, protein: 3, carbs: 12, fat: 9 }
    ]}
  },
  dinner: {
    vegetarian: { name: 'Paneer & Tofu Tikka Masala with Quinoa', prepTime: 20, totalCalories: 780, foods: [
      { name: 'Grilled Paneer & Tofu Tikka', quantity: '200g', calories: 400, protein: 36, carbs: 6, fat: 24 },
      { name: 'Steamed Quinoa', quantity: '150g', calories: 180, protein: 7, carbs: 32, fat: 3 },
      { name: 'Roasted Broccoli & Peppers', quantity: '150g', calories: 140, protein: 5, carbs: 18, fat: 5 }
    ]},
    nonveg: { name: 'Grilled Salmon & Roasted Vegetables', prepTime: 22, totalCalories: 760, foods: [
      { name: 'Grilled Salmon Fillet', quantity: '200g', calories: 380, protein: 44, carbs: 0, fat: 22 },
      { name: 'Sweet Potato Mash', quantity: '150g', calories: 190, protein: 3, carbs: 40, fat: 1 },
      { name: 'Steamed Asparagus', quantity: '150g', calories: 90, protein: 6, carbs: 10, fat: 2 }
    ]},
    vegan: { name: 'Lentil & Roasted Vegetable Curry', prepTime: 25, totalCalories: 620, foods: [
      { name: 'Mixed Lentil Dal', quantity: '250g', calories: 320, protein: 20, carbs: 46, fat: 5 },
      { name: 'Brown Rice', quantity: '150g', calories: 190, protein: 4, carbs: 40, fat: 1 },
      { name: 'Sauteed Greens', quantity: '100g', calories: 70, protein: 3, carbs: 8, fat: 3 }
    ]}
  },
  snack: {
    vegetarian: { name: 'Greek Yogurt & Almond Crunch', prepTime: 5, totalCalories: 410, foods: [
      { name: 'Greek Yogurt 0%', quantity: '250g', calories: 150, protein: 26, carbs: 10, fat: 0 },
      { name: 'Raw Almonds', quantity: '35g', calories: 200, protein: 7, carbs: 7, fat: 17 },
      { name: 'Honey', quantity: '1 tsp', calories: 60, protein: 0, carbs: 15, fat: 0 }
    ]},
    nonveg: { name: 'Turkey Slices & Cottage Cheese', prepTime: 5, totalCalories: 320, foods: [
      { name: 'Sliced Turkey Breast', quantity: '100g', calories: 140, protein: 26, carbs: 0, fat: 4 },
      { name: 'Cottage Cheese', quantity: '150g', calories: 180, protein: 20, carbs: 6, fat: 8 }
    ]},
    vegan: { name: 'Roasted Chickpeas & Fruit', prepTime: 5, totalCalories: 310, foods: [
      { name: 'Roasted Chickpeas', quantity: '80g', calories: 220, protein: 11, carbs: 30, fat: 6 },
      { name: 'Apple', quantity: '1 medium', calories: 90, protein: 0, carbs: 24, fat: 0 }
    ]}
  }
};

function matchTheme(text) {
  let best = null;
  let bestHits = 0;
  for (const themeId of VALID_THEME_IDS) {
    const hits = anyWordHit(text, THEME_SYNONYMS[themeId] || []).length;
    if (hits > bestHits) {
      best = themeId;
      bestHits = hits;
    }
  }
  // 'light'/'white'/'bright' vs 'dark' disambiguation, applied after synonym scoring
  if (!best) {
    if (wordBoundary(text, 'dark')) best = 'midnight_carbon';
    else if (wordBoundary(text, 'light') || wordBoundary(text, 'white') || wordBoundary(text, 'bright')) best = 'clinical_white';
  }
  return best;
}

function buildMeal(mealType, dietTag, wantsLighter) {
  const template = MEAL_TEMPLATES[mealType]?.[dietTag];
  if (!template) return null;
  const scale = wantsLighter ? 0.8 : 1;
  return {
    type: mealType,
    name: wantsLighter ? `${template.name} (Lighter Portion)` : template.name,
    prepTime: template.prepTime,
    totalCalories: Math.round(template.totalCalories * scale),
    foods: template.foods.map(f => ({
      ...f,
      calories: Math.round(f.calories * scale),
      protein: Math.round(f.protein * scale),
      carbs: Math.round(f.carbs * scale),
      fat: Math.round(f.fat * scale)
    }))
  };
}

const DIET_PRIORITY = { nonveg: 2, vegan: 2, vegetarian: 1 };

/**
 * Finds every meal-slot mention and every diet-word mention by character position,
 * then assigns each diet word to whichever meal mention is nearest to it — so
 * "non veg breakfast and veg lunch" binds "non veg" to breakfast and "veg" to
 * lunch instead of one diet flag getting applied to both meals.
 */
function extractPerSlotDiet(clean) {
  const slotMatches = [];
  for (const slot of Object.keys(MEAL_SLOT_WORDS)) {
    for (const word of MEAL_SLOT_WORDS[slot]) {
      const re = new RegExp(`\\b${word}\\b`, 'gi');
      let m;
      while ((m = re.exec(clean)) !== null) slotMatches.push({ slot, index: m.index });
    }
  }
  if (!slotMatches.length) return {};

  const dietMatches = [];
  for (const diet of Object.keys(DIET_WORDS)) {
    for (const word of DIET_WORDS[diet]) {
      const re = new RegExp(`\\b${word.replace(/[-]/g, '[- ]?')}\\b`, 'gi');
      let m;
      while ((m = re.exec(clean)) !== null) dietMatches.push({ diet, index: m.index });
    }
  }

  const bestPerSlotOccurrence = new Map(); // slotMatch -> { diet, distance }
  for (const d of dietMatches) {
    let nearest = null;
    let nearestDist = Infinity;
    for (const s of slotMatches) {
      const dist = Math.abs(s.index - d.index);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = s;
      }
    }
    if (!nearest) continue;
    const existing = bestPerSlotOccurrence.get(nearest);
    const better = !existing
      || DIET_PRIORITY[d.diet] > DIET_PRIORITY[existing.diet]
      || (DIET_PRIORITY[d.diet] === DIET_PRIORITY[existing.diet] && nearestDist < existing.distance);
    if (better) bestPerSlotOccurrence.set(nearest, { diet: d.diet, distance: nearestDist });
  }

  const result = {};
  for (const s of slotMatches) {
    if (!result[s.slot]) {
      const hit = bestPerSlotOccurrence.get(s);
      result[s.slot] = hit ? hit.diet : null;
    }
  }
  return result;
}

/**
 * Classifies + resolves a message locally. Returns null if the request is too
 * ambiguous to safely resolve without an LLM (caller should escalate or ask).
 */
export function classifyLocally(message) {
  const clean = (message || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');

  // THEME
  if (wordBoundary(clean, 'theme') || wordBoundary(clean, 'mood') || wordBoundary(clean, 'vibe') || wordBoundary(clean, 'style')) {
    const themeId = matchTheme(clean);
    if (themeId) {
      return {
        replyText: `Switching your theme to ${themeId.replace(/_/g, ' ')}.`,
        proposedAction: { type: 'CHANGE_THEME', payload: themeId, description: `Switch theme to ${themeId.replace(/_/g, ' ')}` }
      };
    }
    return null; // theme intent detected but couldn't confidently pick one — escalate
  }

  // SNACKS
  if (wordBoundary(clean, 'remove') && (wordBoundary(clean, 'snack') || wordBoundary(clean, 'snacks'))) {
    return {
      replyText: "Removing snacks from today's meal plan and recalculating your totals.",
      proposedAction: { type: 'REMOVE_SNACKS', payload: null, description: 'Remove snacks from meal plan' }
    };
  }
  if ((wordBoundary(clean, 'add') || wordBoundary(clean, 'want')) && (wordBoundary(clean, 'snack') || wordBoundary(clean, 'snacks'))) {
    return {
      replyText: "Adding a snack to today's meal plan.",
      proposedAction: { type: 'ADD_SNACKS', payload: null, description: 'Add snack to meal plan' }
    };
  }

  // WEARABLE
  if (wordBoundary(clean, 'wearable') || wordBoundary(clean, 'fitbit') || wordBoundary(clean, 'garmin') || wordBoundary(clean, 'sync')) {
    return {
      replyText: 'Opening the wearable sync panel.',
      proposedAction: { type: 'SYNC_WEARABLE', payload: null, description: 'Open wearable sync' }
    };
  }

  // PROFILE / AVATAR
  if (wordBoundary(clean, 'avatar') || wordBoundary(clean, 'profile picture') || wordBoundary(clean, 'photo')) {
    return {
      replyText: 'Opening your profile with avatar presets.',
      proposedAction: { type: 'NAVIGATE', payload: '/profile?action=change_avatar', description: 'Navigate to avatar presets' }
    };
  }

  // WORKOUT (muscle group merge)
  const workoutTriggered = wordBoundary(clean, 'workout') || wordBoundary(clean, 'train') || wordBoundary(clean, 'exercise');
  const groups = Object.keys(MUSCLE_GROUP_WORDS).filter(g => anyWordHit(clean, MUSCLE_GROUP_WORDS[g]).length > 0);
  if (workoutTriggered && groups.length > 0) {
    const title = `${groups.map(g => g.toUpperCase()).join(' & ')} Specialization Split`;
    return {
      replyText: `Compiling a ${groups.join(' & ')} workout plan for today.`,
      proposedAction: { type: 'MERGE_WORKOUT_PLANS', payload: { groups, title }, description: `Generate ${title}` },
      mlContext: { groups } // signals the caller to enrich replyText with a real injury-risk check
    };
  }
  if (groups.length > 0 && !workoutTriggered) {
    // "legs and arms today" with no explicit "workout" word — still a workout request
    return {
      replyText: `Compiling a ${groups.join(' & ')} workout plan for today.`,
      proposedAction: { type: 'MERGE_WORKOUT_PLANS', payload: { groups, title: `${groups.map(g => g.toUpperCase()).join(' & ')} Specialization Split` }, description: 'Generate workout plan' },
      mlContext: { groups }
    };
  }

  // NUTRITION (meal slot(s) + diet type) — each diet word binds to whichever meal
  // mention it's nearest to, so "non veg breakfast and veg lunch" gets each meal right
  // instead of one diet flag applied to every meal slot in the message.
  const slotDiets = extractPerSlotDiet(clean);
  const slotsHit = Object.keys(slotDiets);
  if (slotsHit.length > 0) {
    const wantsLighter = LIGHTER_WORDS.some(w => clean.includes(w));
    const meals = slotsHit
      .filter(slot => slotDiets[slot]) // drop slots with no discernible diet signal at all
      .map(slot => buildMeal(slot, slotDiets[slot], wantsLighter))
      .filter(Boolean);
    if (!meals.length) return null; // meal(s) mentioned but no diet signal anywhere — too ambiguous to guess

    if (meals.length === 1) {
      return {
        replyText: `Updating your ${meals[0].type} to ${meals[0].name} (${meals[0].totalCalories} kcal).`,
        proposedAction: { type: 'UPDATE_CUSTOM_MEAL', payload: meals[0], description: `Update ${meals[0].type} to ${meals[0].name}` }
      };
    }
    return {
      replyText: `Updating ${meals.map(m => m.type).join(' and ')} to match your request.`,
      proposedAction: { type: 'UPDATE_MULTIPLE_MEALS', payload: meals, description: `Update ${meals.map(m => m.type).join(' & ')}` }
    };
  }

  return null; // nothing confidently matched — let the caller decide whether to escalate or ask
}
