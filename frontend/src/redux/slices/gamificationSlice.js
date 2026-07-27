import { createSlice } from '@reduxjs/toolkit';

const RANKS = [
  { minLevel: 1, title: 'Novice Lifter' },
  { minLevel: 5, title: 'Iron Nomad' },
  { minLevel: 10, title: 'Cyber Titan' },
  { minLevel: 20, title: 'Apex Athlete' },
  { minLevel: 30, title: 'Fitness Legend' }
];

const getRankTitle = (level) => {
  const rank = [...RANKS].reverse().find(r => level >= r.minLevel);
  return rank ? rank.title : 'Novice Lifter';
};

// No backend persistence exists yet for gamification (see task: persist XP/level/
// achievements to backend), so every page load starts from these genuine zero/
// starter values rather than a fabricated high level - matches resetGamificationForNewUser.
const initialState = {
  level: 1,
  xp: 0,
  xpToNextLevel: 1000,
  rankTitle: 'Novice Lifter',
  archetype: {
    id: 'juggernaut',
    name: 'Strength Juggernaut',
    tagline: 'Heavy Overload & Raw Power',
    icon: 'Dumbbell',
    color: '#3B82F6',
    bonusStats: { strength: 15, endurance: 5, mobility: 0, consistency: 10, recovery: 5 }
  },
  attributes: {
    strength: 10,
    endurance: 10,
    mobility: 10,
    consistency: 5,
    recovery: 10
  },
  dailyQuests: [
    {
      id: 'q1',
      title: 'Power Session',
      desc: 'Complete today’s scheduled AI workout',
      xp: 250,
      completed: false,
      category: 'workout'
    },
    {
      id: 'q2',
      title: 'Volume Beast',
      desc: 'Log over 3,000 kg in total session volume',
      xp: 200,
      completed: false,
      category: 'volume'
    },
    {
      id: 'q3',
      title: 'Macro Optimizer',
      desc: 'Hit your daily protein target (140g+)',
      xp: 150,
      completed: false,
      category: 'nutrition'
    }
  ],
  achievements: [
    { id: 'ach_01', title: 'Iron Vanguard', desc: 'Complete 10 workouts in a row', icon: 'Shield', rarity: 'epic', unlocked: false },
    { id: 'ach_02', title: 'PR Shatterer', desc: 'Set 5 personal records in a single week', icon: 'Flame', rarity: 'legendary', unlocked: false },
    { id: 'ach_03', title: 'Clinical Titan', desc: 'Train 30 days injury-free with AI guidance', icon: 'Award', rarity: 'rare', unlocked: false },
    { id: 'ach_04', title: 'Century Reps', desc: 'Complete 1,000 total reps across exercises', icon: 'Zap', rarity: 'uncommon', unlocked: false },
    { id: 'ach_05', title: 'Marathon Mindset', desc: 'Log a 60-minute continuous workout session', icon: 'Activity', rarity: 'rare', unlocked: false },
    { id: 'ach_06', title: 'Hypertrophy Master', desc: 'Achieve 95%+ Form Score on 3D Coach check', icon: 'Sparkles', rarity: 'legendary', unlocked: false }
  ],
  prHallOfFame: [],
  skillTreePerks: [
    { id: 'perk_1', levelReq: 5, name: 'Overload Mastery', desc: '+15% bonus XP from progressive overload heavy sets', unlocked: false },
    { id: 'perk_2', levelReq: 10, name: 'Rapid Recovery Surge', desc: 'Accelerates stamina recovery score calculation', unlocked: false },
    { id: 'perk_3', levelReq: 15, name: 'Mind-Muscle Resonance', desc: 'Unlocks advanced 3D posture feedback & audio cues', unlocked: false },
    { id: 'perk_4', levelReq: 20, name: 'Apex Synergy', desc: 'Double daily quest XP rewards on 7+ day streaks', unlocked: false }
  ],
  lastVictoryDrop: null,
  soundEnabled: true
};

const gamificationSlice = createSlice({
  name: 'gamification',
  initialState,
  reducers: {
    resetGamificationForNewUser: (state) => {
      state.level = 1;
      state.xp = 0;
      state.xpToNextLevel = 1000;
      state.rankTitle = 'Novice Lifter';
      state.attributes = { strength: 10, endurance: 10, mobility: 10, consistency: 5, recovery: 10 };
      state.dailyQuests = state.dailyQuests.map(q => ({ ...q, completed: false }));
      state.achievements = state.achievements.map(a => ({ ...a, unlocked: false }));
      state.prHallOfFame = [];
    },
    addXp: (state, action) => {
      const amount = action.payload;
      state.xp += amount;

      // Check level up
      while (state.xp >= state.xpToNextLevel) {
        state.xp -= state.xpToNextLevel;
        state.level += 1;
        state.xpToNextLevel = Math.round(state.xpToNextLevel * 1.25);
        state.rankTitle = getRankTitle(state.level);
        
        // Attribute boosts on level up
        state.attributes.strength = Math.min(100, state.attributes.strength + 2);
        state.attributes.endurance = Math.min(100, state.attributes.endurance + 1);
        state.attributes.consistency = Math.min(100, state.attributes.consistency + 2);

        // Check unlocked perks
        state.skillTreePerks.forEach(perk => {
          if (state.level >= perk.levelReq) {
            perk.unlocked = true;
          }
        });
      }
    },
    completeQuest: (state, action) => {
      const questId = action.payload;
      const quest = state.dailyQuests.find(q => q.id === questId);
      if (quest && !quest.completed) {
        quest.completed = true;
        state.xp += quest.xp;
        gamificationSlice.caseReducers.addXp(state, { payload: 0 });
      }
    },
    setArchetype: (state, action) => {
      state.archetype = action.payload;
      if (action.payload.bonusStats) {
        Object.entries(action.payload.bonusStats).forEach(([stat, bonus]) => {
          state.attributes[stat] = Math.min(100, (state.attributes[stat] || 50) + bonus);
        });
      }
    },
    addPRRecord: (state, action) => {
      state.prHallOfFame.unshift(action.payload);
      state.xp += 150;
      gamificationSlice.caseReducers.addXp(state, { payload: 0 });
    },
    setVictoryDrop: (state, action) => {
      state.lastVictoryDrop = action.payload;
    },
    clearVictoryDrop: (state) => {
      state.lastVictoryDrop = null;
    },
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
    }
  }
});

export const {
  resetGamificationForNewUser,
  addXp,
  completeQuest,
  setArchetype,
  addPRRecord,
  setVictoryDrop,
  clearVictoryDrop,
  toggleSound
} = gamificationSlice.actions;

export default gamificationSlice.reducer;
