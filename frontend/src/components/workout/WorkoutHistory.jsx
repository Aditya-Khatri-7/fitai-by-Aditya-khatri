import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { restoreWorkoutVersion } from '../../redux/slices/workoutSlice';
import { GitBranch, RotateCcw, Sparkles, CheckCircle2, History } from 'lucide-react';
import toast from 'react-hot-toast';

export function WorkoutHistory() {
  const dispatch = useDispatch();
  const { versions, todayWorkout } = useSelector(state => state.workout);

  const handleRestoreVersion = (ver) => {
    if (!ver.snapshot) {
      toast.error(`No saved snapshot for v${ver.version} — can't restore.`);
      return;
    }
    dispatch(restoreWorkoutVersion(ver.version));
    toast.success(`⏪ Restored Workout Plan to Version v${ver.version}!`);
  };

  return (
    <div className="p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
        <div>
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
            <History className="w-5 h-5 text-[var(--accent-primary)]" /> WORKOUT REVISION HISTORY & EDIT LOG
          </h3>
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
            Complete version-controlled audit trail of all AI assistant merges, exercise swaps, and manual edits.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] font-extrabold text-xs font-mono border border-[var(--accent-primary)]/30">
          {versions.length} Total Versions
        </span>
      </div>

      <div className="space-y-3">
        {versions.map((ver, idx) => {
          const isCurrent = todayWorkout && todayWorkout.version === ver.version;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs ${
                isCurrent
                  ? 'bg-[var(--accent-glow)]/30 border-[var(--accent-primary)]/60 shadow-lg'
                  : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/40'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg bg-[var(--accent-primary)] text-slate-950 font-black font-mono shadow">
                    v{ver.version}
                  </span>
                  <span className="text-[var(--text-primary)] font-extrabold text-sm">{ver.changes}</span>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> ACTIVE VERSION
                    </span>
                  )}
                </div>
                <p className="text-[var(--text-secondary)] text-xs font-medium leading-relaxed">
                  {ver.aiExplanation || ver.reason}
                </p>
              </div>

              <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--border-color)]">
                <div className="text-right">
                  <span className="text-[var(--text-tertiary)] font-mono text-[10px] block">{ver.date}</span>
                  <span className="px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--accent-primary)] font-bold text-[10px] uppercase border border-[var(--border-color)] block mt-0.5">
                    {(ver.reason || 'ai_update').replace('_', ' ')}
                  </span>
                </div>

                {!isCurrent && (
                  <button
                    onClick={() => handleRestoreVersion(ver)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--accent-glow)] text-[var(--text-primary)] hover:text-[var(--accent-primary)] border border-[var(--border-color)] font-extrabold text-[11px] flex items-center gap-1.5 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Restore v{ver.version}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
