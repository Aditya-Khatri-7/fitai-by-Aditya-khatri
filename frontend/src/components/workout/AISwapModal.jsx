import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setAISwapModalOpen } from '../../redux/slices/uiSlice';
import { swapExercise } from '../../redux/slices/workoutSlice';
import { getRecommendedSwap } from '../../utils/exerciseGraph';
import { Shuffle, Sparkles, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export function AISwapModal() {
  const dispatch = useDispatch();
  const { isAISwapModalOpen, selectedExerciseForSwap } = useSelector(state => state.ui);
  const { user } = useSelector(state => state.auth);

  if (!isAISwapModalOpen || !selectedExerciseForSwap) return null;

  const recommendation = getRecommendedSwap(selectedExerciseForSwap, user);

  const handleConfirmSwap = () => {
    dispatch(swapExercise({
      exerciseIndex: selectedExerciseForSwap.index,
      newExercise: {
        name: recommendation.replacement,
        sets: recommendation.sets,
        reps: recommendation.reps,
        weight: recommendation.weight
      },
      reason: recommendation.reason
    }));

    toast.success(`Swapped to ${recommendation.replacement}!`);
    dispatch(setAISwapModalOpen({ isOpen: false }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={() => dispatch(setAISwapModalOpen({ isOpen: false }))}
          className="absolute top-5 right-5 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--border-color)] flex items-center justify-center font-bold">
            <Shuffle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[var(--text-primary)]">AI Intelligent Exercise Swap</h3>
            <p className="text-xs text-[var(--text-secondary)] font-medium">Rebalance target muscle volume with safe alternatives</p>
          </div>
        </div>

        {/* Comparison Box */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase block">Original Exercise</span>
            <p className="font-extrabold text-[var(--text-primary)]">{selectedExerciseForSwap.name}</p>
            <p className="text-[11px] text-[var(--text-secondary)] font-mono">{selectedExerciseForSwap.sets} sets × {selectedExerciseForSwap.reps}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--accent-glow)] border border-[var(--accent-primary)]/40 space-y-1">
            <span className="text-[10px] font-bold text-[var(--accent-primary)] uppercase block">AI Replacement</span>
            <p className="font-extrabold text-[var(--text-primary)]">{recommendation.replacement}</p>
            <p className="text-[11px] text-[var(--accent-primary)] font-mono font-bold">{recommendation.sets} sets × {recommendation.reps}</p>
          </div>
        </div>

        {/* AI Reason */}
        <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1.5 text-xs">
          <span className="text-[var(--accent-primary)] font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> AI Adaptation Reasoning:
          </span>
          <p className="text-[var(--text-primary)] leading-relaxed font-medium">
            {recommendation.reason}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(setAISwapModalOpen({ isOpen: false }))}
            className="w-1/2 py-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs font-bold border border-[var(--border-color)] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSwap}
            className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg flex items-center justify-center gap-1.5 hover:opacity-90 transition-all"
          >
            <Check className="w-4 h-4" /> Apply Swap
          </button>
        </div>
      </div>
    </div>
  );
}
