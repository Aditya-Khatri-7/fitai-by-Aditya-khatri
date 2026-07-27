/**
 * Deterministic, evidence-grounded meal-timing reasoning — not an LLM guess.
 * Encodes well-established, uncontroversial nutrition/chronobiology principles:
 *  1. Large, high-fat/high-calorie meals close to bedtime are associated with poorer
 *     overnight glucose control and disrupted sleep (digestion competes with the body's
 *     natural drop in metabolic rate and insulin sensitivity later in the day).
 *  2. Protein distributed across meals supports muscle protein synthesis better than
 *     concentrating it into one large serving.
 *  3. Heavier, calorie-dense meals are generally better tolerated earlier in the day,
 *     when subsequent activity can help offset the caloric/glycemic load.
 * This is used both to make AI-generated meal plans timing-aware, and to answer direct
 * questions like "should I eat X for dinner" honestly instead of a generic reply.
 */

const EVENING_SLOTS = ['dinner', 'evening_snack'];
const HEAVY_CALORIE_THRESHOLD = 700;
const HIGH_FAT_THRESHOLD_G = 25;
const HEAVY_FOOD_KEYWORDS = ['fried', 'creamy', 'butter', 'cheese', 'heavy', 'fatty', 'greasy', 'pizza', 'burger', 'deep fried', 'buttery'];

/** Evaluates a structured meal (used when AI-generating/regenerating a meal). */
export function evaluateMealTiming({ mealType, totalCalories = 0, fatGrams = 0 }) {
  const isEvening = EVENING_SLOTS.includes(mealType);
  const isHeavy = totalCalories >= HEAVY_CALORIE_THRESHOLD;
  const isHighFat = fatGrams >= HIGH_FAT_THRESHOLD_G;

  if (isEvening && (isHeavy || isHighFat)) {
    return {
      concern: true,
      reason: "Large, high-fat meals eaten close to bedtime are associated with poorer overnight glucose control and disrupted sleep, since digestion competes with the body's natural drop in metabolic rate at night.",
      suggestion: 'Consider a lighter, lower-fat option for this meal, or shifting your largest meal earlier in the day when activity can help offset it.'
    };
  }
  return { concern: false, reason: null, suggestion: null };
}

/** Evaluates a free-text food request against meal timing (used by the coach chat). */
export function evaluateFoodRequest(foodDescription, mealType) {
  const lower = (foodDescription || '').toLowerCase();
  const seemsHeavy = HEAVY_FOOD_KEYWORDS.some(k => lower.includes(k));
  const isEvening = EVENING_SLOTS.includes(mealType) || lower.includes('night') || lower.includes('dinner');

  if (isEvening && seemsHeavy) {
    return {
      concern: true,
      reason: "A heavy, calorie-dense meal close to bedtime is generally linked to poorer sleep quality and glucose control, since digestion competes with your body's natural overnight metabolic slowdown.",
      suggestion: 'A lighter, protein-forward option would sit better this late — that same meal works better metabolically earlier in the day.'
    };
  }
  return { concern: false, reason: null, suggestion: null };
}
