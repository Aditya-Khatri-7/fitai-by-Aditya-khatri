import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAISwapModalOpen } from '../../redux/slices/uiSlice';
import { detectExerciseConflicts } from '../../utils/conflictDetector';
import { ConflictWarning } from './ConflictWarning';
import { Exercise3DDemo } from './Exercise3DDemo';
import { Shuffle, Play, ListOrdered, ChevronDown } from 'lucide-react';

// Splits the real exercise description (from megaGymDataset) into readable steps by
// sentence — the source data is prose, not a numbered list, so this is a formatting
// pass over real content rather than fabricated instructions.
function toSteps(desc) {
  if (!desc) return [];
  return desc
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}

export function ExerciseCard({ exercise, index }) {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { todayMetrics } = useSelector(state => state.health);
  const [show3D, setShow3D] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  const conflictCheck = detectExerciseConflicts(exercise, user, todayMetrics);
  const steps = toSteps(exercise.instructions);

  return (
    <div className="p-4 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl space-y-3 relative overflow-hidden group hover:border-[var(--accent-primary)] transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[var(--bg-tertiary)] text-[var(--accent-primary)] font-extrabold text-xs flex items-center justify-center border border-[var(--border-color)] shrink-0">
            0{index + 1}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-[var(--text-primary)] flex flex-wrap items-center gap-2">
              <span className="truncate">{exercise.name}</span>
              {exercise.isAISwapped && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-bold shrink-0">
                  AI SWAPPED
                </span>
              )}
            </h4>
            <p className="text-xs text-[var(--text-secondary)] font-mono mt-0.5 truncate">
              {exercise.sets} sets × {exercise.reps} @ {exercise.weight}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          {/* ▶ Show in 3D Button */}
          <button
            onClick={() => setShow3D(true)}
            className="px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-semibold flex items-center gap-1.5 transition-all shadow"
          >
            <Play className="w-3.5 h-3.5 fill-current text-[var(--accent-primary)] shrink-0" /> Show 3D
          </button>

          <button
            onClick={() => dispatch(setAISwapModalOpen({ isOpen: true, exercise: { ...exercise, index } }))}
            className="px-3 py-1.5 rounded-xl bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--border-color)] text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Shuffle className="w-3.5 h-3.5 shrink-0" /> Swap
          </button>
        </div>
      </div>

      {conflictCheck.hasConflict && (
        <ConflictWarning conflicts={conflictCheck.conflicts} />
      )}

      {exercise.notes && (
        <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] p-2.5 rounded-xl border border-[var(--border-color)] font-medium leading-relaxed">
          <strong className="text-[var(--text-primary)] font-semibold">Execution Tip: </strong>{exercise.notes}
        </p>
      )}

      {steps.length > 0 && (
        <div className="border-t border-[var(--border-color)] pt-3">
          <button
            onClick={() => setShowSteps(prev => !prev)}
            className="w-full flex items-center justify-between text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <ListOrdered className="w-3.5 h-3.5" /> How To Perform ({steps.length} steps)
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showSteps ? 'rotate-180' : ''}`} />
          </button>
          {showSteps && (
            <ol className="mt-2.5 space-y-2 text-xs animate-in fade-in duration-200">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-[var(--text-secondary)] leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <Exercise3DDemo exercise={exercise} isOpen={show3D} onClose={() => setShow3D(false)} />
    </div>
  );
}
