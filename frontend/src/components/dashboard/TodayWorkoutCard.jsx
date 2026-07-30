import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAISwapModalOpen } from '../../redux/slices/uiSlice';
import { reshuffleWorkout as reshuffleAction, persistWorkoutEdit } from '../../redux/slices/workoutSlice';
import { useTheme } from '../../context/ThemeContext';
import { Shuffle, ArrowRight, Sparkles, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export function TodayWorkoutCard({ workout }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { mobileMode, isNarrowViewport } = useTheme();
  const isCompact = mobileMode || isNarrowViewport;

  if (!workout) return null;

  const handleReshuffle = () => {
    dispatch(reshuffleAction());
    if (workout._id) {
      dispatch(persistWorkoutEdit({
        id: workout._id,
        exercises: [...workout.exercises].reverse(),
        versionLabel: 'Reshuffled exercise order for antagonist recovery',
        versionReason: 'user_override',
        versionExplanation: 'Optimized exercise sequence to reduce fatigue accumulation.'
      }));
    }
    toast.success('AI Reshuffled Today\'s Workout Order!');
  };

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-5">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--border-color)] text-[10px] font-bold uppercase tracking-wider">
              Version {workout.version} (Active AI Build)
            </span>
            <span className="text-[var(--text-tertiary)] text-xs">•</span>
            <span className="text-[var(--text-secondary)] text-xs flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" /> {workout.durationTarget} Mins
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)] mt-1">{workout.title}</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Focus: {workout.splitFocus}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReshuffle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] hover:opacity-90 text-[var(--text-primary)] text-xs font-semibold transition-colors border border-[var(--border-color)]"
          >
            <Shuffle className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> AI Reshuffle
          </button>
          <button
            onClick={() => navigate('/workouts')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 font-bold text-xs shadow-lg transition-all"
          >
            Open Full Builder <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* AI Explanation Banner */}
      <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-start gap-3 text-xs">
        <Sparkles className="w-4 h-4 text-[var(--accent-primary)] shrink-0 mt-0.5" />
        <p className="text-[var(--text-secondary)] leading-relaxed">
          <strong className="text-[var(--accent-primary)] font-semibold">AI Adaptive Logic: </strong>
          {workout.aiExplanation}
        </p>
      </div>

      {/* Exercises Horizontal Preview Grid */}
      <div className={`grid grid-cols-1 gap-3 ${isCompact ? '' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
        {workout.exercises.map((ex, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2 min-w-0 ${
              ex.isAISwapped
                ? 'bg-amber-950/20 border-amber-500/40'
                : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] hover:border-[var(--accent-primary)]'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center justify-between text-[11px] gap-2">
                <span className="font-bold text-[var(--text-tertiary)] shrink-0">#0{idx + 1}</span>
                {ex.isAISwapped && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[9px] shrink-0">
                    AI Swapped
                  </span>
                )}
              </div>
              <h4 className="text-xs font-bold text-[var(--text-primary)] mt-1 line-clamp-2 leading-snug">{ex.name}</h4>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-mono">
                {ex.sets} sets × {ex.reps} ({ex.weight})
              </p>
            </div>

            <button
              onClick={() => dispatch(setAISwapModalOpen({ isOpen: true, exercise: { ...ex, index: idx } }))}
              className="w-full py-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--accent-primary)] font-semibold text-[11px] border border-[var(--border-color)] transition-colors flex items-center justify-center gap-1"
            >
              <Shuffle className="w-3 h-3" /> AI Swap
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
