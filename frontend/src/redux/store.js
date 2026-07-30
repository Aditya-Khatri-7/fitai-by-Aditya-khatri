import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import workoutReducer from './slices/workoutSlice';
import nutritionReducer from './slices/nutritionSlice';
import healthReducer from './slices/healthSlice';
import aiReducer from './slices/aiSlice';
import uiReducer from './slices/uiSlice';
import gamificationReducer from './slices/gamificationSlice';
import cheatReducer from './slices/cheatSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workout: workoutReducer,
    nutrition: nutritionReducer,
    health: healthReducer,
    ai: aiReducer,
    ui: uiReducer,
    gamification: gamificationReducer,
    cheat: cheatReducer
  }
});
