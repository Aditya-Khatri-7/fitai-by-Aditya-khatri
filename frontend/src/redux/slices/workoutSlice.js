import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Static preset templates a user can manually pick from — a reference catalog like
// exercises.js/foods.js, not per-user fixture data, so it's fine to keep as-is.
export const WORKOUT_PLANS = {
  hypertrophy_upper: {
    _id: 'plan_upper',
    title: 'Hypertrophy Upper Body & Core',
    type: 'strength',
    splitFocus: 'Chest, Shoulders & Triceps',
    durationTarget: 50,
    version: 1,
    status: 'planned',
    caloriesBurned: 420,
    aiExplanation: 'Selected upper body hypertrophy split focusing on chest width, shoulder caps, and tricep extension overload.',
    exercises: [
      { exerciseId: 'bench_press', name: 'Barbell Bench Press', muscleGroups: { primary: ['chest'], secondary: ['triceps', 'shoulders'] }, sets: 4, reps: '8-10', weight: '70 kg', restTime: 90, equipment: 'barbell', isAISwapped: false, notes: 'Focus on explosive concentric phase.' },
      { exerciseId: 'dumbbell_press', name: 'Incline Dumbbell Press', muscleGroups: { primary: ['chest'], secondary: ['shoulders'] }, sets: 3, reps: '10-12', weight: '24 kg', restTime: 75, equipment: 'dumbbell', isAISwapped: false, notes: 'Slight incline at 30 degrees.' },
      { exerciseId: 'overhead_press', name: 'Seated Dumbbell Shoulder Press', muscleGroups: { primary: ['shoulders'], secondary: ['triceps'] }, sets: 3, reps: '10-12', weight: '18 kg', restTime: 75, equipment: 'dumbbell', isAISwapped: true, originalExercise: 'Barbell Overhead Press', swapReason: 'Lower spine compression risk & smoother shoulder path.', notes: 'Controlled eccentric descent.' },
      { exerciseId: 'pushup', name: 'Weighted Decline Push-Up', muscleGroups: { primary: ['chest'], secondary: ['core', 'abs'] }, sets: 3, reps: '12-15', weight: '10 kg plate', restTime: 60, equipment: 'bodyweight_only', isAISwapped: false, notes: 'Burnout set to failure.' }
    ]
  },
  power_pull: {
    _id: 'plan_pull',
    title: 'Power Pull & Back Specialization',
    type: 'strength',
    splitFocus: 'Lats, Upper Back & Biceps',
    durationTarget: 55,
    version: 1,
    status: 'planned',
    caloriesBurned: 460,
    aiExplanation: 'Designed to maximize lat width, upper back thickness, and bicep peak isolation with adaptive pull volume.',
    exercises: [
      { exerciseId: 'lat_row', name: 'Barbell Bent-Over Row', muscleGroups: { primary: ['back', 'lats'], secondary: ['biceps'] }, sets: 4, reps: '8-10', weight: '65 kg', restTime: 90, equipment: 'barbell', isAISwapped: false, notes: 'Pull to lower ribcage with torso flat.' },
      { exerciseId: 'lat_pulldown', name: 'Wide-Grip Lat Pulldown', muscleGroups: { primary: ['lats', 'back'], secondary: ['biceps'] }, sets: 4, reps: '10-12', weight: '55 kg', restTime: 75, equipment: 'cable', isAISwapped: false, notes: 'Squeeze scapula at bottom of contraction.' },
      { exerciseId: 'face_pull', name: 'Cable Face Pull with Rope', muscleGroups: { primary: ['shoulders'], secondary: ['back'] }, sets: 3, reps: '15', weight: '25 kg', restTime: 60, equipment: 'cable', isAISwapped: false, notes: 'Target rear delts and rotator cuff stability.' },
      { exerciseId: 'bicep_curl', name: 'Dumbbell Hammer Curls', muscleGroups: { primary: ['biceps'], secondary: ['forearms'] }, sets: 3, reps: '12', weight: '14 kg', restTime: 60, equipment: 'dumbbell', isAISwapped: false, notes: 'Strict form without momentum.' }
    ]
  },
  legs_titan: {
    _id: 'plan_legs',
    title: 'Legs & Posterior Chain Titan',
    type: 'strength',
    splitFocus: 'Quads, Hamstrings & Glutes',
    durationTarget: 50,
    version: 1,
    status: 'planned',
    caloriesBurned: 480,
    aiExplanation: 'Substituted heavy deep barbell squats with Leg Press to protect knee joints while overloading quad and hamstrings.',
    exercises: [
      { exerciseId: 'leg_press', name: 'Incline Leg Press (Knee-Safe)', muscleGroups: { primary: ['quads', 'legs'], secondary: ['glutes'] }, sets: 4, reps: '10-12', weight: '140 kg', restTime: 90, equipment: 'machine', isAISwapped: true, swapReason: 'Knee strain protection protocol.', notes: 'Deep range of motion without knee locking.' },
      { exerciseId: 'romanian_dl', name: 'Dumbbell Romanian Deadlift', muscleGroups: { primary: ['hamstrings', 'legs'], secondary: ['glutes', 'back'] }, sets: 4, reps: '10-12', weight: '28 kg', restTime: 75, equipment: 'dumbbell', isAISwapped: false, notes: 'Hinge at hips feeling hamstring stretch.' },
      { exerciseId: 'bulgarian_split', name: 'Dumbbell Bulgarian Split Squat', muscleGroups: { primary: ['quads', 'legs'], secondary: ['glutes'] }, sets: 3, reps: '10 per leg', weight: '16 kg', restTime: 60, equipment: 'dumbbell', isAISwapped: false, notes: 'Unilateral leg strength focus.' },
      { exerciseId: 'calf_raise', name: 'Standing Calf Raises', muscleGroups: { primary: ['calves', 'legs'] }, sets: 4, reps: '15-20', weight: '45 kg', restTime: 45, equipment: 'machine', isAISwapped: false, notes: 'Pause at peak contraction.' }
    ]
  },
  full_body: {
    _id: 'plan_fullbody',
    title: 'Full Body Functional AI Hybrid',
    type: 'functional',
    splitFocus: 'Chest, Back, Legs & Core',
    durationTarget: 45,
    version: 1,
    status: 'planned',
    caloriesBurned: 510,
    aiExplanation: 'High-intensity athletic conditioning engaging all major muscle groups in a continuous metabolic workout circuit.',
    exercises: [
      { exerciseId: 'goblet_squat', name: 'Kettlebell Goblet Squat', muscleGroups: { primary: ['quads', 'legs'], secondary: ['core'] }, sets: 4, reps: '12-15', weight: '24 kg', restTime: 60, equipment: 'kettlebell', isAISwapped: false, notes: 'Keep torso upright.' },
      { exerciseId: 'db_row', name: 'Single-Arm Dumbbell Row', muscleGroups: { primary: ['back', 'lats'], secondary: ['biceps'] }, sets: 3, reps: '12', weight: '22 kg', restTime: 60, equipment: 'dumbbell', isAISwapped: false, notes: 'Pull dumbbell towards hip bone.' },
      { exerciseId: 'pushup_tap', name: 'Push-Up with Shoulder Tap', muscleGroups: { primary: ['chest'], secondary: ['core', 'shoulders'] }, sets: 3, reps: '12', weight: 'bodyweight', restTime: 45, equipment: 'bodyweight_only', isAISwapped: false, notes: 'Engage core without swaying hips.' },
      { exerciseId: 'plank_hold', name: 'Weighted RKC Core Plank', muscleGroups: { primary: ['abs', 'core'] }, sets: 3, reps: '45 sec', weight: '10 kg plate', restTime: 45, equipment: 'bodyweight_only', isAISwapped: false, notes: 'Maximal abdominal tension.' }
    ]
  }
};

export const fetchTodayWorkout = createAsyncThunk('workout/fetchToday', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/workouts/today');
    return data;
  } catch (err) {
    if (err.response?.status === 404) return null; // no workout yet — real empty state
    return rejectWithValue(err.response?.data?.message || 'Failed to load workout');
  }
});

export const generateWorkout = createAsyncThunk('workout/generate', async (overrides, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/workouts/generate', overrides || {});
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to generate workout');
  }
});

export const fetchWorkoutRange = createAsyncThunk('workout/fetchRange', async ({ from, to }, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/workouts', { params: { from, to } });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load workouts');
  }
});

export const generateWeekOfWorkouts = createAsyncThunk('workout/generateWeek', async (weekStartDate, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/workouts/generate-week', { weekStartDate });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to generate weekly plan');
  }
});

export const updateWorkoutStatusRemote = createAsyncThunk('workout/updateStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/workouts/${id}/status`, { status });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update workout status');
  }
});

const initialState = {
  todayWorkout: null,
  workoutRange: [],
  versions: [],
  activeVersion: null,
  loading: false,
  error: null
};

const isSameDay = (dateVal) => {
  const d = new Date(dateVal);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
};

const upsertIntoRange = (range, workout) => {
  const idx = range.findIndex(w => w._id === workout._id);
  if (idx !== -1) range[idx] = workout;
  else range.push(workout);
};

const seedBaselineVersion = (state, workout) => {
  if (state.versions.length > 0 || !workout) return;
  state.versions.push({
    version: workout.version || 1,
    date: new Date(workout.createdAt || Date.now()).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
    changes: 'Initial baseline workout plan generated',
    reason: 'ai_generation',
    aiExplanation: workout.aiExplanation || 'Baseline plan created based on your real profile and goals.',
    exercisesCount: workout.exercises?.length || 0,
    snapshot: workout
  });
};

const workoutSlice = createSlice({
  name: 'workout',
  initialState,
  reducers: {
    setTodayWorkout: (state, action) => {
      state.todayWorkout = action.payload;
      try {
        localStorage.setItem('fitai_today_workout', JSON.stringify(action.payload));
      } catch (e) {}
    },
    resetWorkoutForNewUser: (state) => {
      state.todayWorkout = null;
      state.workoutRange = [];
      state.versions = [];
      state.activeVersion = null;
      try {
        localStorage.removeItem('fitai_today_workout');
      } catch (e) {}
    },
    restoreWorkoutVersion: (state, action) => {
      const targetVersion = action.payload;
      const ver = state.versions.find(v => v.version === targetVersion);
      if (!ver || !ver.snapshot) return;
      state.todayWorkout = { ...ver.snapshot, status: 'planned' };
      state.activeVersion = ver.version;
      try {
        localStorage.setItem('fitai_today_workout', JSON.stringify(state.todayWorkout));
      } catch (e) {}
    },
    selectWorkoutPlan: (state, action) => {
      const planId = action.payload;
      if (WORKOUT_PLANS[planId]) {
        state.todayWorkout = { ...WORKOUT_PLANS[planId] };
        try {
          localStorage.setItem('fitai_today_workout', JSON.stringify(state.todayWorkout));
        } catch (e) {}
      }
    },
    createMergedWorkoutPlan: (state, action) => {
      const groups = action.payload.groups || ['legs', 'arms'];
      const title = action.payload.title || `${groups.map(g => g.toUpperCase()).join(' & ')} Specialization Split`;

      let mergedExercises = [];

      if (groups.includes('legs') && groups.includes('arms')) {
        mergedExercises = [
          { exerciseId: 'leg_press', name: 'Incline Leg Press (Knee-Safe)', muscleGroups: { primary: ['quads', 'legs'] }, sets: 4, reps: '10-12', weight: '140 kg', restTime: 90, equipment: 'machine', isAISwapped: true, swapReason: 'Legs & Arms Split', notes: 'Deep quad press' },
          { exerciseId: 'romanian_dl', name: 'Dumbbell Romanian Deadlift', muscleGroups: { primary: ['hamstrings', 'legs'] }, sets: 4, reps: '10-12', weight: '28 kg', restTime: 75, equipment: 'dumbbell', isAISwapped: false, notes: 'Hamstrings hinge' },
          { exerciseId: 'bicep_curl', name: 'Dumbbell Hammer Curls', muscleGroups: { primary: ['biceps', 'arms'] }, sets: 4, reps: '12', weight: '16 kg', restTime: 60, equipment: 'dumbbell', isAISwapped: false, notes: 'Bicep peak isolation' },
          { exerciseId: 'tricep_pushdown', name: 'Cable Tricep Rope Pushdowns', muscleGroups: { primary: ['triceps', 'arms'] }, sets: 4, reps: '12-15', weight: '30 kg', restTime: 60, equipment: 'cable', isAISwapped: false, notes: 'Tricep lockout' }
        ];
      } else if (groups.includes('chest') && groups.includes('legs')) {
        mergedExercises = [
          { exerciseId: 'bench_press', name: 'Barbell Bench Press', muscleGroups: { primary: ['chest'] }, sets: 4, reps: '8-10', weight: '70 kg', restTime: 90, equipment: 'barbell', isAISwapped: false, notes: 'Explosive chest press' },
          { exerciseId: 'incline_press', name: 'Incline Dumbbell Press', muscleGroups: { primary: ['chest'] }, sets: 3, reps: '10-12', weight: '24 kg', restTime: 75, equipment: 'dumbbell', isAISwapped: false, notes: 'Upper chest angle' },
          { exerciseId: 'leg_press', name: 'Incline Leg Press (Knee-Safe)', muscleGroups: { primary: ['quads', 'legs'] }, sets: 4, reps: '10-12', weight: '140 kg', restTime: 90, equipment: 'machine', isAISwapped: true, swapReason: 'Merged Leg Volume', notes: 'Deep quad press' },
          { exerciseId: 'romanian_dl', name: 'Dumbbell Romanian Deadlift', muscleGroups: { primary: ['hamstrings', 'legs'] }, sets: 4, reps: '10-12', weight: '28 kg', restTime: 75, equipment: 'dumbbell', isAISwapped: false, notes: 'Posterior chain hinge' }
        ];
      } else if (groups.includes('chest') && groups.includes('back')) {
        mergedExercises = [
          { exerciseId: 'bench_press', name: 'Barbell Bench Press', muscleGroups: { primary: ['chest'] }, sets: 4, reps: '8-10', weight: '70 kg', restTime: 90, equipment: 'barbell', isAISwapped: false, notes: 'Chest press' },
          { exerciseId: 'lat_row', name: 'Barbell Bent-Over Row', muscleGroups: { primary: ['back', 'lats'] }, sets: 4, reps: '8-10', weight: '65 kg', restTime: 90, equipment: 'barbell', isAISwapped: false, notes: 'Upper back row' },
          { exerciseId: 'incline_press', name: 'Incline Dumbbell Press', muscleGroups: { primary: ['chest'] }, sets: 3, reps: '10-12', weight: '24 kg', restTime: 75, equipment: 'dumbbell', isAISwapped: false, notes: 'Incline chest' },
          { exerciseId: 'lat_pulldown', name: 'Wide-Grip Lat Pulldown', muscleGroups: { primary: ['lats', 'back'] }, sets: 4, reps: '10-12', weight: '55 kg', restTime: 75, equipment: 'cable', isAISwapped: false, notes: 'Lat width pulldown' }
        ];
      } else {
        mergedExercises = [
          WORKOUT_PLANS.legs_titan.exercises[0],
          WORKOUT_PLANS.legs_titan.exercises[1],
          WORKOUT_PLANS.power_pull.exercises[3],
          WORKOUT_PLANS.hypertrophy_upper.exercises[2]
        ];
      }

      const newVersion = (state.todayWorkout ? state.todayWorkout.version || 1 : 1) + 1;

      const mergedPlan = {
        _id: `merged_${Date.now()}`,
        title,
        type: 'merged_hybrid',
        splitFocus: `Merged ${groups.join(' & ')} Specialization`,
        durationTarget: 50,
        version: newVersion,
        status: 'planned',
        caloriesBurned: 520,
        aiExplanation: `Merged workout plan combining targeted volume for ${groups.join(' and ').toUpperCase()}.`,
        exercises: mergedExercises
      };

      state.todayWorkout = mergedPlan;
      state.activeVersion = newVersion;

      state.versions.unshift({
        version: newVersion,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        changes: `Merged ${groups.map(g => g.toUpperCase()).join(' & ')} into 4-exercise hybrid split`,
        reason: `AI Command: Merged ${groups.join(' and ')} workouts`,
        aiExplanation: `Merged targeted sets and reps for ${groups.join(' & ')}.`,
        exercisesCount: mergedExercises.length,
        snapshot: mergedPlan
      });

      try {
        localStorage.setItem('fitai_today_workout', JSON.stringify(mergedPlan));
      } catch (e) {}
    },
    swapExercise: (state, action) => {
      const { exerciseIndex, newExercise, reason } = action.payload;
      if (state.todayWorkout && state.todayWorkout.exercises[exerciseIndex]) {
        const old = state.todayWorkout.exercises[exerciseIndex];
        state.todayWorkout.exercises[exerciseIndex] = {
          ...old,
          ...newExercise,
          isAISwapped: true,
          originalExercise: old.name,
          swapReason: reason
        };
        state.todayWorkout.version = (state.todayWorkout.version || 1) + 1;
        state.activeVersion = state.todayWorkout.version;

        state.versions.unshift({
          version: state.todayWorkout.version,
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          changes: `Swapped ${old.name} for ${newExercise.name}`,
          reason: 'ai_adaptation',
          aiExplanation: reason,
          exercisesCount: state.todayWorkout.exercises.length,
          snapshot: JSON.parse(JSON.stringify(state.todayWorkout))
        });

        try {
          localStorage.setItem('fitai_today_workout', JSON.stringify(state.todayWorkout));
        } catch (e) {}
      }
    },
    updateWorkoutStatus: (state, action) => {
      if (state.todayWorkout) {
        state.todayWorkout.status = action.payload;
        try {
          localStorage.setItem('fitai_today_workout', JSON.stringify(state.todayWorkout));
        } catch (e) {}
      }
    },
    reshuffleWorkout: (state) => {
      if (state.todayWorkout) {
        const newVer = (state.todayWorkout.version || 1) + 1;
        state.todayWorkout = {
          ...state.todayWorkout,
          version: newVer,
          exercises: [...state.todayWorkout.exercises].reverse()
        };
        state.activeVersion = newVer;

        state.versions.unshift({
          version: newVer,
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          changes: `Reshuffled exercise order for antagonist recovery`,
          reason: 'ai_reshuffle',
          aiExplanation: 'Optimized exercise sequence to reduce fatigue accumulation.',
          exercisesCount: state.todayWorkout.exercises.length,
          snapshot: JSON.parse(JSON.stringify(state.todayWorkout))
        });

        try {
          localStorage.setItem('fitai_today_workout', JSON.stringify(state.todayWorkout));
        } catch (e) {}
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodayWorkout.pending, (state) => { state.loading = true; })
      .addCase(fetchTodayWorkout.fulfilled, (state, action) => {
        state.loading = false;
        state.todayWorkout = action.payload;
        if (action.payload) {
          state.activeVersion = action.payload.version;
          seedBaselineVersion(state, action.payload);
        }
      })
      .addCase(fetchTodayWorkout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(generateWorkout.pending, (state) => { state.loading = true; })
      .addCase(generateWorkout.fulfilled, (state, action) => {
        state.loading = false;
        upsertIntoRange(state.workoutRange, action.payload);
        if (isSameDay(action.payload.date)) {
          state.todayWorkout = action.payload;
          state.activeVersion = action.payload.version;
          seedBaselineVersion(state, action.payload);
        }
      })
      .addCase(generateWorkout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchWorkoutRange.fulfilled, (state, action) => {
        state.workoutRange = action.payload;
      })

      .addCase(generateWeekOfWorkouts.fulfilled, (state, action) => {
        action.payload.forEach(w => upsertIntoRange(state.workoutRange, w));
      })

      .addCase(updateWorkoutStatusRemote.fulfilled, (state, action) => {
        if (state.todayWorkout?._id === action.payload._id) {
          state.todayWorkout = action.payload;
        }
        state.workoutRange = state.workoutRange.map(w => w._id === action.payload._id ? action.payload : w);
      });
  }
});

export const {
  setTodayWorkout,
  resetWorkoutForNewUser,
  restoreWorkoutVersion,
  selectWorkoutPlan,
  createMergedWorkoutPlan,
  swapExercise,
  updateWorkoutStatus,
  reshuffleWorkout
} = workoutSlice.actions;

export default workoutSlice.reducer;
