import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Flame, ShieldCheck, RotateCcw, Pause, CalendarRange, CheckCircle2 } from 'lucide-react';
import {
  fetchStreakState,
  pauseStreakToday,
  generateWorkout,
  generateWeekOfWorkouts
} from '../../redux/slices/workoutSlice';
import toast from 'react-hot-toast';

function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

const COPY = {
  none: {
    title: 'Start Your Streak',
    desc: 'Complete a workout today to begin building your streak.',
    icon: Flame,
    color: 'text-[var(--text-tertiary)]'
  },
  completed_today: {
    title: 'Streak Secured Today',
    desc: "You've already logged today — come back tomorrow to keep it going.",
    icon: CheckCircle2,
    color: 'text-emerald-400'
  },
  active: {
    title: 'Continue Your Streak',
    desc: "You're on track — complete today's workout to keep it alive.",
    icon: Flame,
    color: 'text-[var(--accent-primary)]'
  },
  grace: {
    title: 'Regain Your Streak',
    desc: "You missed a day, but you're still in the grace window — complete a workout now and your streak survives.",
    icon: ShieldCheck,
    color: 'text-amber-400'
  },
  lost: {
    title: 'Start a New Streak',
    desc: 'Your streak reset, but every legend starts at Day 1 again.',
    icon: RotateCcw,
    color: 'text-rose-400'
  }
};

export function StreakStatusCard() {
  const dispatch = useDispatch();
  const { streakState, loading } = useSelector(state => state.workout);

  useEffect(() => {
    dispatch(fetchStreakState());
  }, [dispatch]);

  if (!streakState) return null;

  const { state, streak } = streakState;
  const copy = COPY[state] || COPY.none;
  const Icon = copy.icon;

  const handlePrimaryAction = async () => {
    const result = await dispatch(generateWorkout({}));
    if (generateWorkout.fulfilled.match(result)) {
      toast.success(
        state === 'grace'
          ? '🛡️ Catch-up workout ready — complete it to regain your streak!'
          : "🔥 Today's workout is ready!"
      );
      dispatch(fetchStreakState());
    } else {
      toast.error(result.payload || 'Failed to generate workout');
    }
  };

  const handlePause = async () => {
    const result = await dispatch(pauseStreakToday());
    if (pauseStreakToday.fulfilled.match(result)) {
      toast.success('⏸️ Streak paused for today — no workout required, nothing lost.');
    } else {
      toast.error(result.payload || 'Failed to pause streak');
    }
  };

  const handlePlanWeek = async () => {
    const result = await dispatch(generateWeekOfWorkouts(startOfWeek(new Date()).toISOString()));
    if (generateWeekOfWorkouts.fulfilled.match(result)) {
      toast.success('📅 Optimized week plan generated — complete each day to build your streak!');
    } else {
      toast.error(result.payload || 'Failed to plan the week');
    }
  };

  return (
    <div className="p-5 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center ${copy.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-[var(--text-primary)]">{copy.title}</h3>
            <span className="px-2 py-0.5 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] text-[10px] font-bold font-mono shrink-0">
              {streak?.current || 0} Day{streak?.current === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">{copy.desc}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(state === 'active' || state === 'grace' || state === 'lost' || state === 'none') && (
          <button
            onClick={handlePrimaryAction}
            disabled={loading}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all disabled:opacity-60 ${
              state === 'grace'
                ? 'bg-amber-500 text-slate-950 hover:opacity-90'
                : 'bg-[var(--accent-primary)] text-slate-950 hover:opacity-90'
            }`}
          >
            <Icon className="w-4 h-4" />
            {loading ? 'Generating...' : state === 'grace' ? 'Regain Streak' : state === 'lost' ? 'Start New Streak' : 'Continue Streak'}
          </button>
        )}

        {(state === 'active' || state === 'grace') && (
          <button
            onClick={handlePause}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-60"
          >
            <Pause className="w-4 h-4" /> Pause Today
          </button>
        )}

        <button
          onClick={handlePlanWeek}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-60"
        >
          <CalendarRange className="w-4 h-4 text-[var(--accent-primary)]" /> Complete Whole Week
        </button>
      </div>
    </div>
  );
}
