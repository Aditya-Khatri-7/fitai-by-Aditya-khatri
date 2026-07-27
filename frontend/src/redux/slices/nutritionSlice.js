import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchTodayMealPlan = createAsyncThunk('nutrition/fetchToday', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/nutrition/today');
    return data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    return rejectWithValue(err.response?.data?.message || 'Failed to load meal plan');
  }
});

export const generateMealPlan = createAsyncThunk('nutrition/generate', async (overrides, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/nutrition/generate', overrides || {});
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to generate meal plan');
  }
});

export const fetchMealPlanRange = createAsyncThunk('nutrition/fetchRange', async ({ from, to }, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/nutrition', { params: { from, to } });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load meal plans');
  }
});

export const generateWeekOfMealPlans = createAsyncThunk('nutrition/generateWeek', async (weekStartDate, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/nutrition/generate-week', { weekStartDate });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to generate weekly meal plans');
  }
});

export const regenerateSingleMealRemote = createAsyncThunk('nutrition/regenerateSingleMeal', async ({ mealPlanId, mealType }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/nutrition/${mealPlanId}/meals/${mealType}/regenerate`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to regenerate meal');
  }
});

export const fetchGroceryList = createAsyncThunk('nutrition/fetchGroceryList', async ({ from, to } = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/nutrition/grocery-list', { params: { from, to } });
    return data.items;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load grocery list');
  }
});

const initialState = {
  todayMealPlan: null,
  mealPlanRange: [],
  loggedFoods: [],
  groceryList: [], // populated dynamically from real meal plans via fetchGroceryList, not a static array
  loading: false,
  error: null
};

const getMealIndex = (meals, mealType) => {
  const typeLower = (mealType || 'breakfast').toLowerCase();
  const foundIdx = meals.findIndex(m => m.type && m.type.toLowerCase() === typeLower);
  if (foundIdx !== -1) return foundIdx;
  if (typeLower === 'breakfast') return 0;
  if (typeLower === 'lunch') return 1;
  if (typeLower === 'snack') return 2;
  if (typeLower === 'dinner') return meals.length > 3 ? 3 : meals.length - 1;
  return -1;
};

const isSameDay = (dateVal) => {
  const d = new Date(dateVal);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
};

const upsertIntoRange = (range, plan) => {
  const idx = range.findIndex(p => p._id === plan._id);
  if (idx !== -1) range[idx] = plan;
  else range.push(plan);
};

const recalcTotals = (meals) => meals.reduce((acc, m) => ({
  calories: acc.calories + (m.totalCalories || m.calories || 0),
  protein: acc.protein + (m.protein || 0),
  carbs: acc.carbs + (m.carbs || 0),
  fat: acc.fat + (m.fat || 0)
}), { calories: 0, protein: 0, carbs: 0, fat: 0 });

const nutritionSlice = createSlice({
  name: 'nutrition',
  initialState,
  reducers: {
    setTodayMealPlan: (state, action) => {
      state.todayMealPlan = action.payload;
    },
    resetNutritionForNewUser: (state) => {
      state.todayMealPlan = null;
      state.mealPlanRange = [];
      state.loggedFoods = [];
      state.groceryList = [];
    },
    updateSpecificMeal: (state, action) => {
      const newMeal = action.payload;
      if (state.todayMealPlan && state.todayMealPlan.meals) {
        const mealType = newMeal.type || 'breakfast';
        const targetIdx = getMealIndex(state.todayMealPlan.meals, mealType);

        if (targetIdx !== -1 && targetIdx < state.todayMealPlan.meals.length) {
          state.todayMealPlan.meals[targetIdx] = newMeal;
        } else {
          state.todayMealPlan.meals.push(newMeal);
        }
        state.todayMealPlan.dailyTotals = recalcTotals(state.todayMealPlan.meals);
      }
    },
    updateMultipleMeals: (state, action) => {
      const mealsList = action.payload;
      if (state.todayMealPlan && state.todayMealPlan.meals && Array.isArray(mealsList)) {
        mealsList.forEach(newMeal => {
          const mealType = newMeal.type || 'breakfast';
          const targetIdx = getMealIndex(state.todayMealPlan.meals, mealType);

          if (targetIdx !== -1 && targetIdx < state.todayMealPlan.meals.length) {
            state.todayMealPlan.meals[targetIdx] = newMeal;
          } else {
            state.todayMealPlan.meals.push(newMeal);
          }
        });
        state.todayMealPlan.dailyTotals = recalcTotals(state.todayMealPlan.meals);
      }
    },
    removeSnacksFromMealPlan: (state) => {
      if (state.todayMealPlan && state.todayMealPlan.meals) {
        state.todayMealPlan.meals = state.todayMealPlan.meals.filter(
          meal => !(meal.type && meal.type.toLowerCase().includes('snack')) && !(meal.name && meal.name.toLowerCase().includes('snack'))
        );
        state.todayMealPlan.dailyTotals = recalcTotals(state.todayMealPlan.meals);
      }
    },
    addSnacksToMealPlan: (state) => {
      if (state.todayMealPlan && state.todayMealPlan.meals) {
        const hasSnack = state.todayMealPlan.meals.some(m => (m.type && m.type.toLowerCase().includes('snack')) || (m.name && m.name.toLowerCase().includes('snack')));
        if (!hasSnack) {
          state.todayMealPlan.meals.splice(2, 0, {
            type: 'snack',
            name: 'Greek Yogurt & Almond Crunch',
            prepTime: 5,
            totalCalories: 410,
            foods: [
              { name: 'Greek Yogurt 0%', quantity: '250g', calories: 150, protein: 26, carbs: 10, fat: 0 },
              { name: 'Raw Almonds', quantity: '35g', calories: 200, protein: 7, carbs: 7, fat: 17 },
              { name: 'Honey', quantity: '1 tsp', calories: 60, protein: 0, carbs: 15, fat: 0 }
            ]
          });
          state.todayMealPlan.dailyTotals = recalcTotals(state.todayMealPlan.meals);
        }
      }
    },
    swapBreakfastMeal: (state, action) => {
      const isNonVeg = action.payload === 'non_veg' || action.payload === 'non-veg' || action.payload === 'eggs';
      if (state.todayMealPlan && state.todayMealPlan.meals) {
        const bIndex = 0;

        const newBreakfast = isNonVeg
          ? {
              type: 'breakfast',
              name: 'Scrambled Egg Whites, Turkey Bacon & Avocado Toast',
              prepTime: 12,
              totalCalories: 620,
              foods: [
                { name: 'Egg Whites & Whole Egg', quantity: '4 large', calories: 180, protein: 28, carbs: 2, fat: 6 },
                { name: 'Lean Turkey Bacon Strip', quantity: '3 strips', calories: 140, protein: 18, carbs: 1, fat: 7 },
                { name: 'Whole Grain Sourdough', quantity: '2 slices', calories: 180, protein: 8, carbs: 32, fat: 2 },
                { name: 'Sliced Avocado', quantity: '1/2 fruit', calories: 120, protein: 2, carbs: 6, fat: 11 }
              ]
            }
          : {
              type: 'breakfast',
              name: 'Protein Oat Bowl with Blueberries & Almond Butter',
              prepTime: 10,
              totalCalories: 580,
              foods: [
                { name: 'Rolled Oats', quantity: '80g', calories: 300, protein: 11, carbs: 54, fat: 5 },
                { name: 'Whey Protein Isolate', quantity: '30g', calories: 120, protein: 25, carbs: 2, fat: 1 },
                { name: 'Blueberries & Chia', quantity: '100g', calories: 160, protein: 4, carbs: 24, fat: 6 }
              ]
            };

        state.todayMealPlan.meals[bIndex] = newBreakfast;
        state.todayMealPlan.dailyTotals = recalcTotals(state.todayMealPlan.meals);
      }
    },
    swapDinnerToVegetarian: (state) => {
      if (state.todayMealPlan && state.todayMealPlan.meals) {
        const dinnerIndex = getMealIndex(state.todayMealPlan.meals, 'dinner');
        const vegDinner = {
          type: 'dinner',
          name: 'Paneer & Tofu Tikka Masala with Quinoa & Roasted Veggies',
          prepTime: 20,
          totalCalories: 980,
          foods: [
            { name: 'Grilled Paneer & Tofu', quantity: '220g', calories: 420, protein: 38, carbs: 6, fat: 26 },
            { name: 'Steamed Quinoa', quantity: '200g', calories: 240, protein: 9, carbs: 42, fat: 4 },
            { name: 'Roasted Broccoli & Peppers', quantity: '200g', calories: 180, protein: 6, carbs: 24, fat: 7 },
            { name: 'Avocado Salad', quantity: '1/2 whole', calories: 140, protein: 2, carbs: 8, fat: 12 }
          ]
        };
        if (dinnerIndex !== -1 && dinnerIndex < state.todayMealPlan.meals.length) {
          state.todayMealPlan.meals[dinnerIndex] = vegDinner;
        } else {
          state.todayMealPlan.meals.push(vegDinner);
        }
        state.todayMealPlan.dailyTotals = recalcTotals(state.todayMealPlan.meals);
      }
    },
    logFoodItem: (state, action) => {
      state.loggedFoods.push(action.payload);
      if (state.todayMealPlan && state.todayMealPlan.dailyTotals) {
        state.todayMealPlan.dailyTotals.calories += action.payload.calories || 0;
        state.todayMealPlan.dailyTotals.protein += action.payload.protein || 0;
        state.todayMealPlan.dailyTotals.carbs += action.payload.carbs || 0;
        state.todayMealPlan.dailyTotals.fat += action.payload.fat || 0;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodayMealPlan.pending, (state) => { state.loading = true; })
      .addCase(fetchTodayMealPlan.fulfilled, (state, action) => {
        state.loading = false;
        state.todayMealPlan = action.payload;
      })
      .addCase(fetchTodayMealPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(generateMealPlan.pending, (state) => { state.loading = true; })
      .addCase(generateMealPlan.fulfilled, (state, action) => {
        state.loading = false;
        upsertIntoRange(state.mealPlanRange, action.payload);
        if (isSameDay(action.payload.date)) {
          state.todayMealPlan = action.payload;
        }
      })
      .addCase(generateMealPlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchMealPlanRange.fulfilled, (state, action) => {
        state.mealPlanRange = action.payload;
      })

      .addCase(generateWeekOfMealPlans.fulfilled, (state, action) => {
        action.payload.forEach(p => upsertIntoRange(state.mealPlanRange, p));
      })

      .addCase(regenerateSingleMealRemote.fulfilled, (state, action) => {
        const plan = action.payload.mealPlan;
        upsertIntoRange(state.mealPlanRange, plan);
        if (isSameDay(plan.date)) {
          state.todayMealPlan = plan;
        }
      })

      .addCase(fetchGroceryList.fulfilled, (state, action) => {
        state.groceryList = action.payload;
      });
  }
});

export const {
  setTodayMealPlan,
  resetNutritionForNewUser,
  updateSpecificMeal,
  updateMultipleMeals,
  removeSnacksFromMealPlan,
  addSnacksToMealPlan,
  swapBreakfastMeal,
  swapDinnerToVegetarian,
  logFoodItem
} = nutritionSlice.actions;

export default nutritionSlice.reducer;
