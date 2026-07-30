import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { logout } from './authSlice';

const initialState = {
  xp: 0,
  level: 1,
  mealCost: 300,
  dayCost: 1000,
  mealsUsedThisWeek: 0,
  maxMealsPerWeek: 3,
  daysUsedThisWeek: 0,
  maxDaysPerWeek: 1,
  canCheatMeal: false,
  canCheatDay: false,
  recentRedemptions: [],
  loading: false,
  redeeming: false,
  error: null
};

export const fetchCheatStatus = createAsyncThunk('cheat/fetchStatus', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/cheat/status');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load cheat status');
  }
});

export const redeemCheat = createAsyncThunk('cheat/redeem', async ({ type, mealSlot }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/cheat/redeem', { type, mealSlot });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to redeem cheat');
  }
});

const cheatSlice = createSlice({
  name: 'cheat',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCheatStatus.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCheatStatus.fulfilled, (state, action) => { state.loading = false; Object.assign(state, action.payload); })
      .addCase(fetchCheatStatus.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(redeemCheat.pending, (state) => { state.redeeming = true; state.error = null; })
      .addCase(redeemCheat.fulfilled, (state, action) => { state.redeeming = false; Object.assign(state, action.payload); })
      .addCase(redeemCheat.rejected, (state, action) => { state.redeeming = false; state.error = action.payload; })
      // Without this, logging in as a different user in the same tab kept showing
      // the previous account's cheat-meal/cheat-day XP balance until a fetch happened to fire.
      .addCase(logout, () => initialState);
  }
});

export default cheatSlice.reducer;
