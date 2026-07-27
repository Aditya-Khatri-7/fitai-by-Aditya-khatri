function isYesterday(date, today) {
  const d = new Date(date);
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  return d.toDateString() === y.toDateString();
}

function isSameDay(date, today) {
  return new Date(date).toDateString() === new Date(today).toDateString();
}

/** Increments/resets a user's real activity streak based on their last logged activity date. Mutates and saves the user. */
export async function applyStreakUpdate(user) {
  const today = new Date();
  const last = user.streak?.lastWorkoutDate;

  if (!last) {
    user.streak = { current: 1, longest: Math.max(1, user.streak?.longest || 0), lastWorkoutDate: today };
  } else if (isSameDay(last, today)) {
    // Already logged today — no change.
    return user;
  } else if (isYesterday(last, today)) {
    user.streak.current = (user.streak.current || 0) + 1;
    user.streak.longest = Math.max(user.streak.longest || 0, user.streak.current);
    user.streak.lastWorkoutDate = today;
  } else {
    user.streak.current = 1;
    user.streak.longest = Math.max(user.streak.longest || 0, 1);
    user.streak.lastWorkoutDate = today;
  }

  await user.save();
  return user;
}
