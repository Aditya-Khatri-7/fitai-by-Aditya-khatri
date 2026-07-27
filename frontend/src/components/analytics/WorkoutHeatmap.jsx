import React from 'react';
import { DEMO_HEATMAP_DATA } from '../../data/demoData';
import { Calendar } from 'lucide-react';

export function WorkoutHeatmap() {
  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--accent-primary)]" /> 90-DAY WORKOUT CONSISTENCY HEATMAP
        </h3>
        <span className="text-xs text-[var(--text-tertiary)] font-mono">82% Consistency Rate</span>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto py-2">
        {DEMO_HEATMAP_DATA.map((item, idx) => (
          <div
            key={idx}
            title={`${item.date}: ${item.count} workouts`}
            className={`w-3.5 h-3.5 rounded-sm transition-all ${
              item.count === 0
                ? 'bg-[var(--bg-tertiary)] border border-[var(--border-color)]'
                : item.count === 1
                ? 'bg-[var(--accent-glow)]'
                : 'bg-[var(--accent-primary)] shadow-sm'
            }`}
          ></div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 text-[10px] text-[var(--text-tertiary)]">
        <span>Less</span>
        <span className="w-3 h-3 rounded-sm bg-[var(--bg-tertiary)]"></span>
        <span className="w-3 h-3 rounded-sm bg-[var(--accent-glow)]"></span>
        <span className="w-3 h-3 rounded-sm bg-[var(--accent-primary)]"></span>
        <span>More</span>
      </div>
    </div>
  );
}
