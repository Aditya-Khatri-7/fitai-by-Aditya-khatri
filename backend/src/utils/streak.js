// Missing up to this many consecutive days still lets a completed workout "catch up"
// the streak instead of resetting to 1 — a grace period, not unlimited forgiveness.
const GRACE_WINDOW_DAYS = 2;

function daysBetween(a, b) {
  const MS_PER_DAY = 86400000;
  const startA = new Date(a); startA.setHours(0, 0, 0, 0);
  const startB = new Date(b); startB.setHours(0, 0, 0, 0);
  return Math.round((startB - startA) / MS_PER_DAY);
}

/** Increments/resets a user's real activity streak based on their last logged activity
 * date. A gap of 2-3 days (GRACE_WINDOW_DAYS) still increments instead of resetting —
 * this is the "catch-up" mechanic: complete a workout within the grace window and the
 * streak survives. Mutates and saves the user. */
export async function applyStreakUpdate(user) {
  const today = new Date();
  const last = user.streak?.lastWorkoutDate;

  if (!last) {
    user.streak = { current: 1, longest: Math.max(1, user.streak?.longest || 0), lastWorkoutDate: today };
  } else {
    const gap = daysBetween(last, today);
    if (gap === 0) {
      return user; // already logged today — no change
    } else if (gap >= 1 && gap <= GRACE_WINDOW_DAYS + 1) {
      user.streak.current = (user.streak.current || 0) + 1;
      user.streak.longest = Math.max(user.streak.longest || 0, user.streak.current);
      user.streak.lastWorkoutDate = today;
    } else {
      user.streak.current = 1;
      user.streak.longest = Math.max(user.streak.longest || 0, 1);
      user.streak.lastWorkoutDate = today;
    }
  }

  await user.save();
  return user;
}

/** "Freezes" the streak for today without requiring a workout — like Duolingo's streak
 * freeze. lastWorkoutDate advances to today so the gap resets, but current/longest are
 * untouched (no reward, but no loss either). */
export async function pauseStreakForToday(user) {
  const today = new Date();
  user.streak = user.streak || { current: 0, longest: 0 };
  user.streak.lastWorkoutDate = today;
  await user.save();
  return user;
}

/** Read-only streak state for frontend button logic — does not mutate or save. */
export function getStreakState(user) {
  const last = user.streak?.lastWorkoutDate;
  const current = user.streak?.current || 0;
  if (!last || current === 0) return { state: 'none', gap: null };

  const gap = daysBetween(last, new Date());
  if (gap <= 0) return { state: 'completed_today', gap };
  if (gap === 1) return { state: 'active', gap };
  if (gap <= GRACE_WINDOW_DAYS + 1) return { state: 'grace', gap };
  return { state: 'lost', gap };
}

export { GRACE_WINDOW_DAYS };
