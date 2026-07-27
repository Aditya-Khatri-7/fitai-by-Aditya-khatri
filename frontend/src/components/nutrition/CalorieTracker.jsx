import React from 'react';
import { getMacroPercentage } from '../../utils/helpers';
import { PieChart } from 'lucide-react';

export function CalorieTracker({ totals, targetCalories = 2850 }) {
  if (!totals) return null;

  const proteinPct = getMacroPercentage(totals.protein, 190);
  const carbsPct = getMacroPercentage(totals.carbs, 320);
  const fatPct = getMacroPercentage(totals.fat, 85);
  const calPct = getMacroPercentage(totals.calories, targetCalories);

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
          <PieChart className="w-4 h-4 text-[var(--accent-primary)]" /> DAILY MACRONUTRIENT & CALORIE PROGRESS
        </h3>
        <span className="text-xs font-mono font-extrabold text-[var(--accent-primary)]">
          {totals.calories} / {targetCalories} kcal ({calPct}%)
        </span>
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
