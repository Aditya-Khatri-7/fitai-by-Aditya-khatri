import Workout from '../models/Workout.js';
import MealPlan from '../models/MealPlan.js';
import { ensureGamificationDefaults } from './gamification.js';
import { getCheatMessage } from './cheatDayMessages.js';

// XP-gated ad-hoc cheat system — separate from the free recurring weekly cheat
// day in preferences.cheatDays (e.g. Sunday). This one works on any day but has
// to be earned: redeeming spends banked XP and is capped per rolling week, so a
// user can't just cheat every meal every day.
export const CHEAT_MEAL_XP_COST = 300;
export const CHEAT_DAY_XP_COST = 1000;
export const MAX_CHEAT_MEALS_PER_WEEK = 3;
export const MAX_CHEAT_DAYS_PER_WEEK = 1;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getCheatStatus(user) {
  const g = ensureGamificationDefaults(user);
  const redemptions = g.cheatRedemptions || [];
  const weekAgo = Date.now() - WEEK_MS;
  const recent = redemptions.filter(r => new Date(r.date).getTime() >= weekAgo);

  const mealsUsedThisWeek = recent.filter(r => r.type === 'meal').length;
  const daysUsedThisWeek = recent.filter(r => r.type === 'day').length;

  return {
    xp: g.xp,
    level: g.level,
    mealCost: CHEAT_MEAL_XP_COST,
    dayCost: CHEAT_DAY_XP_COST,
    mealsUsedThisWeek,
    maxMealsPerWeek: MAX_CHEAT_MEALS_PER_WEEK,
    daysUsedThisWeek,
    maxDaysPerWeek: MAX_CHEAT_DAYS_PER_WEEK,
    canCheatMeal: g.xp >= CHEAT_MEAL_XP_COST && mealsUsedThisWeek < MAX_CHEAT_MEALS_PER_WEEK,
    canCheatDay: g.xp >= CHEAT_DAY_XP_COST && daysUsedThisWeek < MAX_CHEAT_DAYS_PER_WEEK,
    recentRedemptions: recent
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
  };
}

/** Validates + applies a cheat redemption in place. Throws a plain Error with a
 * user-facing message on any failure so the controller can 400 with it directly. */
export async function redeemCheat(user, { type, mealSlot }) {
  if (!['meal', 'day'].includes(type)) {
    throw new Error('Cheat type must be "meal" or "day".');
  }

  const status = getCheatStatus(user);
  const g = ensureGamificationDefaults(user);

  if (type === 'meal') {
    if (!status.canCheatMeal) {
      throw new Error(
        status.xp < status.mealCost
          ? `Not enough XP — a cheat meal costs ${status.mealCost} XP, you have ${status.xp}.`
          : `You've already used all ${status.maxMealsPerWeek} cheat meals for this week.`
      );
    }
    g.xp -= CHEAT_MEAL_XP_COST;
    g.cheatRedemptions = g.cheatRedemptions || [];
    g.cheatRedemptions.push({ date: new Date(), type: 'meal', mealSlot: mealSlot || null, xpSpent: CHEAT_MEAL_XP_COST });
  } else {
    if (!status.canCheatDay) {
      throw new Error(
        status.xp < status.dayCost
          ? `Not enough XP — a cheat day costs ${status.dayCost} XP, you have ${status.xp}.`
          : `You've already used your ${status.maxDaysPerWeek} cheat day for this week.`
      );
    }
    g.xp -= CHEAT_DAY_XP_COST;
    g.cheatRedemptions = g.cheatRedemptions || [];
    g.cheatRedemptions.push({ date: new Date(), type: 'day', xpSpent: CHEAT_DAY_XP_COST });

    // Flag today's already-generated workout/meal plan as a cheat day (if they
    // exist) so the rest of the app's existing isCheatDay UI picks it up.
    const today = startOfDay(new Date());
    const [workout, mealPlan] = await Promise.all([
      Workout.findOne({ userId: user._id, date: today }),
      MealPlan.findOne({ userId: user._id, date: today })
    ]);
    if (workout) {
      workout.isCheatDay = true;
      workout.cheatMessage = getCheatMessage('workout_only');
      await workout.save();
    }
    if (mealPlan) {
      mealPlan.isCheatDay = true;
      mealPlan.cheatMessage = getCheatMessage('meal_only');
      await mealPlan.save();
    }
  }

  return getCheatStatus(user);
}
