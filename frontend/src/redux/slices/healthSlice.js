import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { logout } from './authSlice';

export const fetchHealthSnapshot = createAsyncThunk('health/fetchSnapshot', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/health/snapshot');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load health data');
  }
});

export const fetchHealthMetricRange = createAsyncThunk('health/fetchMetricRange', async ({ from, to }, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/health/metrics', { params: { from, to } });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load health metric history');
  }
});

export const syncWearable = createAsyncThunk('health/syncWearable', async (metrics, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/wearable/sync', metrics);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Wearable sync failed');
  }
});

export const extractHealthIntake = createAsyncThunk('health/extractIntake', async ({ text, priorAnswers }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/health/intake/extract', { text, priorAnswers });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to analyze health update');
  }
});

export const confirmHealthIntake = createAsyncThunk('health/confirmIntake', async ({ updateType, conditions }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/health/intake/confirm', { updateType, conditions });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to apply health update');
  }
});

const initialState = {
  todayMetrics: null,
  metricsHistory: [],
  metricsRange: [],
  injuries: [],
  chronicConditions: [],
  aiMemories: [],
  loading: false,
  syncing: false,
  error: null
};

const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {
    updateTodayMetrics: (state, action) => {
      state.todayMetrics = { ...state.todayMetrics, ...action.payload };
    },
    resetForNewUser: (state) => {
      state.todayMetrics = null;
      state.metricsHistory = [];
      state.injuries = [];
      state.chronicConditions = [];
      state.aiMemories = [];
    },
    addAIMemory: (state, action) => {
      state.aiMemories.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealthSnapshot.pending, (state) => { state.loading = true; })
      .addCase(fetchHealthSnapshot.fulfilled, (state, action) => {
        state.loading = false;
        state.todayMetrics = action.payload.todayMetrics;
        state.injuries = action.payload.injuries || [];
        state.chronicConditions = action.payload.chronicConditions || [];
        state.aiMemories = action.payload.aiMemories || [];
      })
      .addCase(fetchHealthSnapshot.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchHealthMetricRange.fulfilled, (state, action) => {
        state.metricsRange = action.payload;
      })

      .addCase(syncWearable.pending, (state) => { state.syncing = true; })
      .addCase(syncWearable.fulfilled, (state, action) => {
        state.syncing = false;
        state.todayMetrics = action.payload;
        state.metricsHistory.unshift(action.payload);
      })
      .addCase(syncWearable.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload;
      })
      // Without this, logging in as a different user in the same tab kept showing
      // the previous account's injuries/chronic conditions/AI memories until a fetch happened to fire.
      .addCase(logout, () => initialState);
  }
});

export const { updateTodayMetrics, resetForNewUser, addAIMemory } = healthSlice.actions;
export default healthSlice.reducer;
