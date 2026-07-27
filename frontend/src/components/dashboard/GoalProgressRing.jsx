import React from 'react';
import { Target, TrendingUp } from 'lucide-react';

export function GoalProgressRing({ goal, currentValue }) {
  const hasGoal = goal && goal.targetValue != null && goal.startValue != null;

  if (!hasGoal) {
    return (
      <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl flex flex-col justify-center items-center text-center space-y-2">
        <Target className="w-6 h-6 text-[var(--text-tertiary)]" />
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">No Goal Set Yet</h3>
        <p className="text-[11px] text-[var(--text-tertiary)]">Set a fitness goal in your Profile to track progress here.</p>
      </div>
    );
  }

  const hasCurrent = currentValue != null;
  const current = hasCurrent ? currentValue : goal.startValue;
  const total = Math.abs(goal.targetValue - goal.startValue);
  const pct = Math.min(100, Math.max(0, Math.round(((current - goal.startValue) / (total || 1)) * 100)));

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl flex flex-col justify-between space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
          <Target className="w-4 h-4 text-[var(--accent-primary)]" /> GOAL PROGRESS
        </h3>
        <span className="text-xs font-bold text-[var(--accent-primary)] uppercase">{goal.type?.replace('_', ' ')}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-extrabold text-[var(--text-primary)] font-mono">{hasCurrent ? `${pct}%` : '--'}</span>
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            {goal.targetValue} {goal.unit} Target
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 transition-all duration-1000"
            style={{ width: `${hasCurrent ? pct : 0}%` }}
          ></div>
        </div>
        {!hasCurrent && (
          <p className="text-[10px] text-[var(--text-tertiary)]">Update your current {goal.unit} in Profile to calculate real progress.</p>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pt-2 border-t border-[var(--border-color)]">
        <span>Started: {goal.startValue} {goal.unit}</span>
        {goal.deadline && (
          <span className="text-[var(--accent-primary)] font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Target: {new Date(goal.deadline).toLocaleDateString([], { month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}
