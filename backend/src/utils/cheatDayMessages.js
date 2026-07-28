const WORKOUT_CHEAT_MESSAGES = [
  "Rest day, officially sanctioned. Put your feet up — you earned it.",
  "No workout today. Go take a walk if you feel like it, or don't. Your call.",
  "Today's the day you skip the gym guilt-free. Come back stronger tomorrow.",
  "Cheat day active — your muscles get a break too."
];

const MEAL_CHEAT_MESSAGES = [
  "No meal plan today — go to your nearest place and get whatever you're craving.",
  "Cheat day! Order that burger you've been thinking about all week.",
  "Skip the macros today. Have the thing you actually want to eat.",
  "Today's a free pass — pizza, burger, whatever sounds good. Enjoy it."
];

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function findCheatDayConfig(user, date, domain) {
  const cheatDays = user.preferences?.cheatDays || [];
  const dayOfWeek = new Date(date).getDay();
  return cheatDays.find(c =>
    c.dayOfWeek === dayOfWeek && (c.type === 'full' || c.type === domain)
  );
}

export function getCheatMessage(domain) {
  return domain === 'workout_only' ? pickRandom(WORKOUT_CHEAT_MESSAGES) : pickRandom(MEAL_CHEAT_MESSAGES);
}
