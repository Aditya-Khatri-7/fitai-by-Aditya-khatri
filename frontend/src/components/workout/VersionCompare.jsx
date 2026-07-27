import React from 'react';
import { useSelector } from 'react-redux';
import { GitCompare } from 'lucide-react';

function formatExercise(ex) {
  if (!ex) return null;
  return `${ex.name} — ${ex.sets} × ${ex.reps}${ex.weight ? ` (${ex.weight})` : ''}`;
}

export function VersionCompare() {
  const { versions, todayWorkout } = useSelector(state => state.workout);

  const baselineVersion = versions[versions.length - 1]; // oldest = baseline
  const activeVersion = todayWorkout;

  if (!baselineVersion?.snapshot || !activeVersion) {
    return (
      <div className="p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-2">
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-purple-400" /> VERSION DIFF COMPARISON
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">Not enough version history yet to compare.</p>
      </div>
    );
  }

  const baselineExercises = baselineVersion.snapshot.exercises || [];
  const activeExercises = activeVersion.exercises || [];
  const rowCount = Math.max(baselineExercises.length, activeExercises.length);

  return (
    <div className="p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
        <GitCompare className="w-4 h-4 text-purple-400" /> VERSION DIFF COMPARISON (v{baselineVersion.version} Baseline vs v{activeVersion.version} Active)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
          <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-bold border border-[var(--border-color)]">
            v{baselineVersion.version} Baseline Plan
          </span>
          <ul className="space-y-1.5 text-[var(--text-secondary)] font-mono">
            {Array.from({ length: rowCount }).map((_, i) => {
              const base = baselineExercises[i];
              const active = activeExercises[i];
              const changed = base?.name !== active?.name;
              return (
                <li key={i} className={changed ? 'line-through decoration-rose-500 opacity-60' : 'text-[var(--text-primary)] font-semibold'}>
                  {i + 1}. {formatExercise(base) || '—'}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--accent-glow)] border border-[var(--accent-primary)]/40 space-y-2">
          <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-primary)] text-slate-950 font-extrabold">
            v{activeVersion.version} AI Adapted Plan (Active)
          </span>
          <ul className="space-y-1.5 text-[var(--text-primary)] font-mono">
            {Array.from({ length: rowCount }).map((_, i) => {
              const base = baselineExercises[i];
              const active = activeExercises[i];
              const changed = base?.name !== active?.name;
              return (
                <li key={i} className={changed ? 'text-emerald-400 font-extrabold' : 'font-semibold'}>
                  {i + 1}. {formatExercise(active) || '—'}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
