import React from 'react';
import { getMacroPercentage } from '../../utils/helpers';
import { PieChart, UtensilsCrossed } from 'lucide-react';

function sumConsumed(meals = []) {
  return meals.filter(m => m.consumed).reduce((acc, m) => ({
    calories: acc.calories + (m.totalCalories || 0),
    protein: acc.protein + (m.foods || []).reduce((s, f) => s + (f.protein || 0), 0),
    carbs: acc.carbs + (m.foods || []).reduce((s, f) => s + (f.carbs || 0), 0),
    fat: acc.fat + (m.foods || []).reduce((s, f) => s + (f.fat || 0), 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

// Shows BOTH the AI-generated plan's totals (what was planned) AND what the user
// actually marked as eaten (real "consumed so far" progress) — previously this only
// ever showed the plan's totals regardless of whether any meal had actually been eaten.
export function CalorieTracker({ totals, targetCalories = 2850, meals = [] }) {
  if (!totals) return null;

  const consumedCount = meals.filter(m => m.consumed).length;
  const consumed = sumConsumed(meals);

  const proteinPct = getMacroPercentage(consumed.protein, 190);
  const carbsPct = getMacroPercentage(consumed.carbs, 320);
  const fatPct = getMacroPercentage(consumed.fat, 85);
  const calPct = getMacroPercentage(consumed.calories, targetCalories);

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
          <PieChart className="w-4 h-4 text-[var(--accent-primary)]" /> CONSUMED SO FAR TODAY
        </h3>
        <span className="text-xs font-mono font-extrabold text-[var(--accent-primary)]">
          {consumed.calories} / {targetCalories} kcal ({calPct}%)
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
        <UtensilsCrossed className="w-3.5 h-3.5" />
        {consumedCount === 0
          ? `No meals logged as eaten yet — tap the circle on a meal below when you eat it. (Plan total: ${totals.calories} kcal)`
          : `${consumedCount} of ${meals.length} planned meals logged as eaten. Plan total: ${totals.calories} kcal.`}
      </div>

      {/* Main Calorie Bar */}
      <div className="w-full h-3 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--accent-primary)] via-purple-500 to-pink-500 transition-all duration-1000"
          style={{ width: `${calPct}%` }}
        ></div>
      </div>

      {/* Macro Grid */}
      <div className="grid grid-cols-3 gap-3 text-xs pt-2">
        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
          <span className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase">PROTEIN</span>
          <p className="font-extrabold text-[var(--text-primary)] font-mono">{totals.protein}g / 190g</p>
          <div className="w-full h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
            <div className="h-full bg-[var(--accent-primary)]" style={{ width: `${proteinPct}%` }}></div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
          <span className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase">CARBS</span>
          <p className="font-extrabold text-[var(--text-primary)] font-mono">{totals.carbs}g / 320g</p>
          <div className="w-full h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
            <div className="h-full bg-purple-400" style={{ width: `${carbsPct}%` }}></div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
          <span className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase">FAT</span>
          <p className="font-extrabold text-[var(--text-primary)] font-mono">{totals.fat}g / 85g</p>
          <div className="w-full h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
            <div className="h-full bg-pink-400" style={{ width: `${fatPct}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
