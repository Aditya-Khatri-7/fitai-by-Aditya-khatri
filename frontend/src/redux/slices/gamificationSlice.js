import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { logout } from './authSlice';

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
  soundEnabled: true,
  loading: false,
  error: null
};

// Maps the backend's compact persisted shape ({level, xp, unlockedPerkIds, ...})
// back onto this slice's richer display shape (full quest/achievement/perk objects
// with a derived `completed`/`unlocked` flag) rather than trusting the client to
// keep its own copy of level/xp math in sync with the server.
function mergeGamificationState(state, backend) {
  if (!backend) return;
  state.level = backend.level ?? state.level;
  state.xp = backend.xp ?? state.xp;
  state.xpToNextLevel = backend.xpToNextLevel ?? state.xpToNextLevel;
  state.rankTitle = backend.rankTitle || getRankTitle(state.level);
  if (backend.archetype?.id) state.archetype = backend.archetype;
  if (backend.attributes) state.attributes = backend.attributes;

  const completedIds = backend.dailyQuestsCompleted || [];
  state.dailyQuests = state.dailyQuests.map(q => ({ ...q, completed: completedIds.includes(q.id) }));

  const unlockedAchievementIds = backend.unlockedAchievementIds || [];
  state.achievements = state.achievements.map(a => ({ ...a, unlocked: unlockedAchievementIds.includes(a.id) }));

  const unlockedPerkIds = backend.unlockedPerkIds || [];
  state.skillTreePerks = state.skillTreePerks.map(p => ({ ...p, unlocked: unlockedPerkIds.includes(p.id) }));

  state.prHallOfFame = backend.prHallOfFame || [];
}

export const fetchGamificationState = createAsyncThunk('gamification/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/gamification');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load gamification state');
  }
});

export const addXp = createAsyncThunk('gamification/addXp', async (amount, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/gamification/xp', { amount });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to award XP');
  }
});

export const completeQuest = createAsyncThunk('gamification/completeQuest', async (questId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/gamification/quests/${questId}/complete`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to complete quest');
  }
});

export const setArchetype = createAsyncThunk('gamification/setArchetype', async (archetype, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/gamification/archetype', { archetype });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to set archetype');
  }
});

export const addPRRecord = createAsyncThunk('gamification/addPRRecord', async (record, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/gamification/pr-records', { record });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add PR record');
  }
});

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
    setVictoryDrop: (state, action) => {
      state.lastVictoryDrop = action.payload;
    },
    clearVictoryDrop: (state) => {
      state.lastVictoryDrop = null;
    },
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGamificationState.pending, (state) => { state.loading = true; })
      .addCase(fetchGamificationState.fulfilled, (state, action) => {
        state.loading = false;
        mergeGamificationState(state, action.payload);
      })
      .addCase(fetchGamificationState.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addXp.fulfilled, (state, action) => mergeGamificationState(state, action.payload))
      .addCase(completeQuest.fulfilled, (state, action) => mergeGamificationState(state, action.payload))
      .addCase(setArchetype.fulfilled, (state, action) => mergeGamificationState(state, action.payload))
      .addCase(addPRRecord.fulfilled, (state, action) => mergeGamificationState(state, action.payload))
      // Without this, logging in as a different user in the same tab kept showing
      // the previous account's level/XP/achievements until a fetch happened to fire.
      .addCase(logout, () => initialState);
  }
});

export const {
  resetGamificationForNewUser,
  setVictoryDrop,
  clearVictoryDrop,
  toggleSound
} = gamificationSlice.actions;

export default gamificationSlice.reducer;
