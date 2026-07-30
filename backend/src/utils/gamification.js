// Server-side port of frontend/src/redux/slices/gamificationSlice.js's addXp/leveling
// math, so XP and level are computed once (here) and persisted, instead of trusting
// a client-computed level. Keep any leveling-formula changes in sync with that file.

const RANKS = [
  { minLevel: 1, title: 'Novice Lifter' },
  { minLevel: 5, title: 'Iron Nomad' },
  { minLevel: 10, title: 'Cyber Titan' },
  { minLevel: 20, title: 'Apex Athlete' },
  { minLevel: 30, title: 'Fitness Legend' }
];

const SKILL_TREE_PERKS = [
  { id: 'perk_1', levelReq: 5 },
  { id: 'perk_2', levelReq: 10 },
  { id: 'perk_3', levelReq: 15 },
  { id: 'perk_4', levelReq: 20 }
];

const DEFAULT_ARCHETYPE = {
  id: 'juggernaut', name: 'Strength Juggernaut', tagline: 'Heavy Overload & Raw Power',
  icon: 'Dumbbell', color: '#3B82F6',
  bonusStats: { strength: 15, endurance: 5, mobility: 0, consistency: 10, recovery: 5 }
};

const DAILY_QUEST_DEFS = {
  q1: { xp: 250 },
  q2: { xp: 200 },
  q3: { xp: 150 }
};

function getRankTitle(level) {
  const rank = [...RANKS].reverse().find(r => level >= r.minLevel);
  return rank ? rank.title : 'Novice Lifter';
}

/** Ensures a user document has a gamification subdocument with sane defaults —
 * lazy-initializes rather than requiring a migration script. */
export function ensureGamificationDefaults(user) {
  if (!user.gamification) user.gamification = {};
  const g = user.gamification;
  if (g.level == null) g.level = 1;
  if (g.xp == null) g.xp = 0;
  if (g.xpToNextLevel == null) g.xpToNextLevel = 1000;
  if (!g.rankTitle) g.rankTitle = 'Novice Lifter';
  if (!g.archetype || !g.archetype.id) g.archetype = DEFAULT_ARCHETYPE;
  if (!g.attributes) g.attributes = { strength: 10, endurance: 10, mobility: 10, consistency: 5, recovery: 10 };
  if (!g.dailyQuestsCompleted) g.dailyQuestsCompleted = [];
  if (!g.unlockedAchievementIds) g.unlockedAchievementIds = [];
  if (!g.unlockedPerkIds) g.unlockedPerkIds = [];
  if (!g.prHallOfFame) g.prHallOfFame = [];
  if (!g.cheatRedemptions) g.cheatRedemptions = [];
  return g;
}

/** Resets daily quest completion at day boundaries, mirroring the streak module's
 * day-granularity reset pattern rather than persisting "completed" forever. */
export function ensureDailyQuestsFresh(user) {
  const g = ensureGamificationDefaults(user);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const resetDate = g.dailyQuestsResetDate ? new Date(g.dailyQuestsResetDate) : null;
  if (resetDate) resetDate.setHours(0, 0, 0, 0);

  if (!resetDate || resetDate.getTime() !== today.getTime()) {
    g.dailyQuestsCompleted = [];
    g.dailyQuestsResetDate = today;
  }
  return g;
}

/** Applies an XP gain and any resulting level-ups/perk-unlocks in place. */
export function applyXp(user, amount) {
  const g = ensureGamificationDefaults(user);
  g.xp += amount;

  while (g.xp >= g.xpToNextLevel) {
    g.xp -= g.xpToNextLevel;
    g.level += 1;
    g.xpToNextLevel = Math.round(g.xpToNextLevel * 1.25);
    g.rankTitle = getRankTitle(g.level);

    g.attributes.strength = Math.min(100, g.attributes.strength + 2);
    g.attributes.endurance = Math.min(100, g.attributes.endurance + 1);
    g.attributes.consistency = Math.min(100, g.attributes.consistency + 2);

    SKILL_TREE_PERKS.forEach(perk => {
      if (g.level >= perk.levelReq && !g.unlockedPerkIds.includes(perk.id)) {
        g.unlockedPerkIds.push(perk.id);
      }
    });
  }
  return g;
}

export function completeQuest(user, questId) {
  const g = ensureDailyQuestsFresh(user);
  if (g.dailyQuestsCompleted.includes(questId)) return g;
  const def = DAILY_QUEST_DEFS[questId];
  if (!def) return g;
  g.dailyQuestsCompleted.push(questId);
  applyXp(user, def.xp);
  return user.gamification;
}

export function setArchetype(user, archetype) {
  const g = ensureGamificationDefaults(user);
  g.archetype = archetype;
  if (archetype?.bonusStats) {
    Object.entries(archetype.bonusStats).forEach(([stat, bonus]) => {
      if (g.attributes[stat] == null) g.attributes[stat] = 50;
      g.attributes[stat] = Math.min(100, g.attributes[stat] + bonus);
    });
  }
  return g;
}

export function addPRRecord(user, record) {
  const g = ensureGamificationDefaults(user);
  g.prHallOfFame.unshift(record);
  applyXp(user, 150);
  checkAndUnlockAchievements(user);
  return user.gamification;
}

/** Records a completed workout session's real stats (reps, duration) — called from
 * the workout-status endpoint when a session is marked completed, so achievement
 * checks below have real numbers to compare against instead of never-updated zeros. */
export function recordWorkoutCompletion(user, { totalReps = 0, durationMins = 0 } = {}) {
  const g = ensureGamificationDefaults(user);
  g.totalWorkoutsCompleted = (g.totalWorkoutsCompleted || 0) + 1;
  g.totalRepsLogged = (g.totalRepsLogged || 0) + totalReps;
  g.longestCompletedWorkoutMins = Math.max(g.longestCompletedWorkoutMins || 0, durationMins);
  checkAndUnlockAchievements(user);
  return g;
}

/** Real, computable achievement checks only — each one is tied to an actual stored
 * number (streak, PR log, rep count, session duration), not a fabricated unlock.
 * ach_06 (95%+ form score) is intentionally excluded: no form-scoring model exists
 * in this app, so it stays permanently locked rather than being faked. */
export function checkAndUnlockAchievements(user) {
  const g = ensureGamificationDefaults(user);
  const unlock = (id) => {
    if (!g.unlockedAchievementIds.includes(id)) {
      g.unlockedAchievementIds.push(id);
      applyXp(user, 100);
    }
  };

  const streak = user.streak?.current || 0;
  if (streak >= 10) unlock('ach_01'); // Iron Vanguard — 10-day streak

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const prsThisWeek = (g.prHallOfFame || []).filter(pr => new Date(pr.date).getTime() >= weekAgo).length;
  if (prsThisWeek >= 5) unlock('ach_02'); // PR Shatterer

  if (streak >= 30) unlock('ach_03'); // Clinical Titan — 30-day streak

  if ((g.totalRepsLogged || 0) >= 1000) unlock('ach_04'); // Century Reps

  if ((g.longestCompletedWorkoutMins || 0) >= 60) unlock('ach_05'); // Marathon Mindset

  return g;
}
