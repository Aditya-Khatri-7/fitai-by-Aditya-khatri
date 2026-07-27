import React from 'react';
import { useSelector } from 'react-redux';
import { TrendingUp } from 'lucide-react';

// No RPE/set-log history is tracked yet, so suggestions are derived from the
// current real workout's load/rep targets using a standard ~2.5-5% overload
// heuristic, not fabricated claims about past sessions we never recorded.
function buildSuggestions(exercises) {
  return exercises.slice(0, 3).map((ex) => {
    const weightMatch = /([\d.]+)\s*kg/i.exec(ex.weight || '');
    if (weightMatch) {
      const nextWeight = (parseFloat(weightMatch[1]) * 1.025).toFixed(1);
      return { exercise: ex.name, action: `Try ${nextWeight} kg next session`, reason: `Standard progressive overload from current ${ex.weight}` };
    }
    return { exercise: ex.name, action: 'Add 1-2 reps or a slow eccentric', reason: `Current target: ${ex.sets} sets x ${ex.reps}` };
  });
}

export function ProgressiveOverload() {
  const { todayWorkout } = useSelector(state => state.workout);
  const suggestions = todayWorkout?.exercises?.length ? buildSuggestions(todayWorkout.exercises) : [];

  return (
    <div className="p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-400" /> AI PROGRESSIVE OVERLOAD SUGGESTIONS
      </h3>

      {suggestions.length === 0 && (
        <p className="text-[11px] text-[var(--text-secondary)]">Generate a workout to receive load/rep progression suggestions.</p>
      )}

      <div className="space-y-2 text-xs">
        {suggestions.map((sug, i) => (
          <div key={i} className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between gap-3">
            <div>
              <span className="font-extrabold text-[var(--text-primary)]">{sug.exercise}</span>
              <p className="text-[var(--text-secondary)] text-[11px] font-medium">{sug.reason}</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 font-extrabold text-[11px] border border-emerald-500/30 shrink-0">
              {sug.action}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
