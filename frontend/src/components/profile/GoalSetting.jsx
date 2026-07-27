import React from 'react';
import { GOAL_TYPES } from '../../utils/constants';
import { Target, Flame, Dumbbell, Activity, Trophy, Sun, ShieldCheck } from 'lucide-react';

export function GoalSetting({ currentGoal, onChange }) {
  const icons = { Flame, Dumbbell, Activity, Trophy, Sun, ShieldCheck };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {GOAL_TYPES.map((goal) => {
        const isSel = currentGoal === goal.id;
        const IconComponent = icons[goal.icon] || Target;
        return (
          <button
            type="button"
            key={goal.id}
            onClick={() => onChange(goal.id)}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition-all ${
              isSel
                ? 'bg-[var(--accent-glow)] border-[var(--accent-primary)] text-[var(--text-primary)] shadow-xl ring-1 ring-[var(--accent-primary)]'
                : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent-glow)] text-[var(--accent-primary)] flex items-center justify-center">
                <IconComponent className="w-4 h-4" />
              </div>
              {isSel && <span className="px-2 py-0.5 rounded-full bg-[var(--accent-primary)] text-slate-950 font-extrabold text-[9px] uppercase">Active Target</span>}
            </div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">{goal.label}</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-normal">{goal.description}</p>
          </button>
        );
      })}
    </div>
  );
}
