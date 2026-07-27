import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { MealCard } from './MealCard';
import { CalorieTracker } from './CalorieTracker';
import { GroceryList } from './GroceryList';
import { ChronicDietCard } from './ChronicDietCard';
import { DietaryProfile } from './DietaryProfile';
import { fetchTodayMealPlan, generateMealPlan, fetchGroceryList } from '../../redux/slices/nutritionSlice';
import { Sparkles, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function MealPlanner() {
  const dispatch = useDispatch();
  const { todayMealPlan, groceryList, loading } = useSelector(state => state.nutrition);

  useEffect(() => {
    dispatch(fetchTodayMealPlan());
    dispatch(fetchGroceryList());
  }, [dispatch]);

  const handleRegenerate = async () => {
    const result = await dispatch(generateMealPlan());
    if (generateMealPlan.fulfilled.match(result)) {
      dispatch(fetchGroceryList());
      toast.success("AI Regenerated Today's Meal Plan!");
    } else {
      toast.error(result.payload || 'Failed to regenerate meal plan');
    }
  };

  if (!todayMealPlan) {
    return (
      <div className="p-10 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center space-y-4">
        <Sparkles className="w-8 h-8 text-[var(--accent-primary)] mx-auto" />
        <h3 className="text-lg font-extrabold text-[var(--text-primary)]">No meal plan generated yet</h3>
        <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
          Let FitAI generate today's meal plan based on your real goals, dietary preferences, and any chronic conditions.
        </p>
        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-[var(--accent-primary)] text-slate-950 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 mx-auto disabled:opacity-60"
        >
          <Wand2 className="w-4 h-4" /> {loading ? 'Generating...' : 'Generate My Meal Plan'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--border-color)] text-xs font-bold">
            AI Personalized Meal Plan
          </span>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">Adaptive Nutrition Studio</h2>
          <p className="text-xs text-[var(--text-secondary)]">Tailored to daily workout caloric burn and health profile</p>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all disabled:opacity-60"
        >
          <Sparkles className="w-4 h-4" /> {loading ? 'Regenerating...' : 'AI Regenerate Plan'}
        </button>
      </div>

      <CalorieTracker totals={todayMealPlan.dailyTotals} targetCalories={todayMealPlan.targetCalories} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meals Column */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">TODAY'S SCHEDULED MEALS</h3>
          <div className="space-y-4">
            {todayMealPlan.meals.map((meal, idx) => (
              <MealCard key={idx} meal={meal} mealPlanId={todayMealPlan._id} />
            ))}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <ChronicDietCard adjustments={todayMealPlan.chronicAdjustments} />
          <DietaryProfile />
          <GroceryList items={groceryList.map(i => i.name)} />
        </div>
      </div>
    </div>
  );
}
