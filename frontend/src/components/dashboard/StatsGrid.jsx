import React from 'react';
import { Flame, Footprints, Droplets, Trophy } from 'lucide-react';

export function StatsGrid({ metrics, streak }) {
  const stats = [
    { label: 'Calories Burned', value: metrics?.caloriesBurned ? `${metrics.caloriesBurned} kcal` : '-- kcal', target: 'Target 2,600', icon: Flame, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Daily Steps', value: metrics?.steps ? metrics.steps.toLocaleString() : '--', target: 'Target 10,000', icon: Footprints, color: 'text-[var(--accent-primary)]', bg: 'bg-[var(--accent-glow)]' },
    { label: 'Water Hydration', value: metrics?.hydration !== undefined ? `${metrics.hydration} / 8 glasses` : '0 / 8 glasses', target: 'Target 8 glasses', icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Active Workout Streak', value: `${streak?.current || 0} Days`, target: `Personal Best: ${streak?.longest || 0} Days`, icon: Trophy, color: 'text-purple-400', bg: 'bg-purple-500/10' }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div key={idx} className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">{item.label}</p>
              <h3 className="text-lg font-extrabold text-[var(--text-primary)] mt-0.5 tracking-tight font-mono">{item.value}</h3>
              <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{item.target}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
