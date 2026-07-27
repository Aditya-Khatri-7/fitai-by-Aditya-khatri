import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { regenerateSingleMealRemote } from '../../redux/slices/nutritionSlice';
import { Utensils, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export function MealCard({ meal, mealPlanId }) {
  const dispatch = useDispatch();
  const [swapping, setSwapping] = useState(false);

  if (!meal) return null;

  const handleSwap = async () => {
    if (!mealPlanId) return;
    setSwapping(true);
    const result = await dispatch(regenerateSingleMealRemote({ mealPlanId, mealType: meal.type }));
    setSwapping(false);
    if (regenerateSingleMealRemote.fulfilled.match(result)) {
      toast.success(`Swapped your ${meal.type}!`);
    } else {
      toast.error(result.payload || 'Failed to swap meal');
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl space-y-4 hover:border-[var(--accent-primary)] transition-all">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-glow)] text-[var(--accent-primary)] font-extrabold text-xs flex items-center justify-center border border-[var(--border-color)]">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-wider">{meal.type}</span>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">{meal.name}</h4>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="text-right">
            <span className="text-sm font-extrabold text-[var(--text-primary)] font-mono">{meal.totalCalories} kcal</span>
            <span className="text-[11px] text-[var(--text-secondary)] block flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3" /> {meal.prepTime} Mins Prep
            </span>
          </div>
          {mealPlanId && (
            <button
              onClick={handleSwap}
              disabled={swapping}
              title="Swap this meal"
              className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--accent-glow)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] border border-[var(--border-color)] transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${swapping ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {meal.timingNote?.concern && (
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2 text-[11px]">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-semibold">{meal.timingNote.reason}</p>
            <p className="text-amber-400/80 mt-0.5">{meal.timingNote.suggestion}</p>
          </div>
        </div>
      )}

      {/* Foods Table */}
      <div className="space-y-2 text-xs">
        {meal.foods.map((food, idx) => (
          <div key={idx} className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between">
            <div>
              <span className="font-bold text-[var(--text-primary)]">{food.name}</span>
              <span className="text-[var(--text-secondary)] text-[11px] block">{food.quantity}</span>
            </div>
            <div className="text-right font-mono text-[11px] text-[var(--text-secondary)]">
              <span>{food.calories} cal</span>
              <span className="text-[var(--text-tertiary)] block">P:{food.protein}g | C:{food.carbs}g | F:{food.fat}g</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
