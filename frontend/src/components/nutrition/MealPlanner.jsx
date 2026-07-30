import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MealCard } from './MealCard';
import { CalorieTracker } from './CalorieTracker';
import { GroceryList } from './GroceryList';
import { ChronicDietCard } from './ChronicDietCard';
import { DietaryProfile } from './DietaryProfile';
import { Modal } from '../ui/Modal';
import { useTheme } from '../../context/ThemeContext';
import { fetchTodayMealPlan, generateMealPlan, fetchGroceryList, fetchMealPlanRange } from '../../redux/slices/nutritionSlice';
import { Sparkles, Wand2, CalendarClock, X, User, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

function toDateKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export function MealPlanner() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const isToday = !dateParam || dateParam === toDateKey(new Date());
  const { mobileMode, isNarrowViewport } = useTheme();
  const isMobileLayout = mobileMode || isNarrowViewport;
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showGroceryModal, setShowGroceryModal] = useState(false);

  const { todayMealPlan, mealPlanRange, groceryList, loading } = useSelector(state => state.nutrition);

  useEffect(() => {
    if (isToday) {
      dispatch(fetchTodayMealPlan());
    } else {
      dispatch(fetchMealPlanRange({ from: dateParam, to: dateParam }));
    }
    dispatch(fetchGroceryList());
  }, [dispatch, dateParam, isToday]);

  const activePlan = isToday ? todayMealPlan : mealPlanRange.find(p => toDateKey(p.date) === dateParam);

  const handleRegenerate = async () => {
    const result = await dispatch(generateMealPlan(isToday ? {} : { date: dateParam }));
    if (generateMealPlan.fulfilled.match(result)) {
      dispatch(fetchGroceryList());
      toast.success(isToday ? "AI Regenerated Today's Meal Plan!" : 'AI Regenerated Meal Plan!');
    } else {
      toast.error(result.payload || 'Failed to regenerate meal plan');
    }
  };

  const dateLabel = dateParam
    ? new Date(dateParam).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
    : null;

  const dateBanner = !isToday && (
    <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--accent-glow)] border border-[var(--accent-primary)]/40 text-xs">
      <span className="flex items-center gap-2 font-bold text-[var(--accent-primary)]">
        <CalendarClock className="w-4 h-4" /> Planning for {dateLabel} — changes will apply when that day arrives.
      </span>
      <button
        onClick={() => { setSearchParams({}); }}
        className="px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] flex items-center gap-1 font-bold"
      >
        <X className="w-3 h-3" /> Back to Today
      </button>
    </div>
  );

  if (!activePlan) {
    return (
      <div className="space-y-4">
        {dateBanner}
        <div className="p-10 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center space-y-4">
          <Sparkles className="w-8 h-8 text-[var(--accent-primary)] mx-auto" />
          <h3 className="text-lg font-extrabold text-[var(--text-primary)]">No meal plan generated yet</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            Let FitAI generate {isToday ? "today's" : `the ${dateLabel}`} meal plan based on your real goals, dietary preferences, and any chronic conditions.
          </p>
          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-[var(--accent-primary)] text-slate-950 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 mx-auto disabled:opacity-60"
          >
            <Wand2 className="w-4 h-4" /> {loading ? 'Generating...' : 'Generate Meal Plan'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dateBanner}

      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--border-color)] text-xs font-bold">
            AI Personalized Meal Plan
          </span>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">Adaptive Nutrition Studio</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            {isToday ? 'Tailored to daily workout caloric burn and health profile' : `Editing plan for ${dateLabel}`}
          </p>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all disabled:opacity-60"
        >
          <Sparkles className="w-4 h-4" /> {loading ? 'Regenerating...' : 'AI Regenerate Plan'}
        </button>
      </div>

      <CalorieTracker totals={activePlan.dailyTotals} targetCalories={activePlan.targetCalories} meals={activePlan.meals} />

      <div className={`grid grid-cols-1 gap-6 ${isMobileLayout ? '' : 'lg:grid-cols-3'}`}>
        {/* Meals Column */}
        <div className={`space-y-4 ${isMobileLayout ? '' : 'lg:col-span-2'}`}>
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            {isToday ? "TODAY'S SCHEDULED MEALS" : 'SCHEDULED MEALS'}
          </h3>
          <div className="space-y-4">
            {activePlan.meals.map((meal, idx) => (
              <MealCard key={idx} meal={meal} mealPlanId={activePlan._id} />
            ))}
          </div>
        </div>

        {/* Sidebar Column — on mobile the preferences/grocery tiles are grouped
            into a single "More Options" tile instead of separate floating
            buttons, and the whole column stacks under meals full-width instead
            of squeezing into a narrow side column. Desktop keeps the original
            3-col layout with tiles inline. */}
        <div className="space-y-6">
          <ChronicDietCard adjustments={activePlan.chronicAdjustments} />

          {isMobileLayout ? (
            <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl space-y-3">
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">More Options</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowPreferencesModal(true)}
                  className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex flex-col items-center justify-center gap-2 text-center hover:border-[var(--accent-primary)]/50 transition-all"
                >
                  <User className="w-5 h-5 text-[var(--accent-primary)]" />
                  <span className="text-[11px] font-extrabold text-[var(--text-primary)]">Diet Preferences</span>
                </button>
                <button
                  onClick={() => setShowGroceryModal(true)}
                  className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex flex-col items-center justify-center gap-2 text-center hover:border-[var(--accent-primary)]/50 transition-all"
                >
                  <ShoppingCart className="w-5 h-5 text-[var(--accent-primary)]" />
                  <span className="text-[11px] font-extrabold text-[var(--text-primary)]">Grocery List{groceryList?.length ? ` (${groceryList.length})` : ''}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <DietaryProfile />
              <GroceryList items={groceryList} />
            </>
          )}
        </div>
      </div>

      {isMobileLayout && (
        <>
          <Modal isOpen={showPreferencesModal} onClose={() => setShowPreferencesModal(false)} title="Dietary Preferences & Allergies" maxWidth="max-w-lg">
            <DietaryProfile />
          </Modal>
          <Modal isOpen={showGroceryModal} onClose={() => setShowGroceryModal(false)} title="Weekly Grocery List" maxWidth="max-w-lg">
            <GroceryList items={groceryList} />
          </Modal>
        </>
      )}
    </div>
  );
}
