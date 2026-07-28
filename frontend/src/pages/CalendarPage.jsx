import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { updateProfile } from '../redux/slices/authSlice';
import {
  fetchWorkoutRange,
  generateWorkout,
  generateWeekOfWorkouts
} from '../redux/slices/workoutSlice';
import {
  fetchMealPlanRange,
  generateMealPlan,
  generateWeekOfMealPlans
} from '../redux/slices/nutritionSlice';
import { Sparkles, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Dumbbell, Utensils, Wand2, RefreshCw, PartyPopper, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function toDateKey(d) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDate(a, b) {
  return toDateKey(a) === toDateKey(b);
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // days since Sunday, matches DAY_LABELS/month grid
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(anchor) {
  const monday = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getMonthGridDays(anchor) {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

// Cell tint reflects real completion state, not just a status dot — a completed day
// (streak credit earned) reads distinctly from a missed past day or a planned future one.
function cellTone(workout, isPast, isToday) {
  if (workout?.isCheatDay) return 'bg-purple-500/10 border-purple-500/40 text-purple-300';
  if (workout?.status === 'completed') return 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300';
  if (isPast && workout && workout.status !== 'completed') return 'bg-rose-500/10 border-rose-500/40 text-rose-300';
  if (isPast && !workout) return 'bg-[var(--bg-tertiary)]/60 border-[var(--border-color)] text-[var(--text-tertiary)]';
  if (isToday) return 'bg-[var(--bg-tertiary)] border-[var(--accent-primary)] text-[var(--text-primary)]';
  return 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]';
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function CalendarPage() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { workoutRange, loading: workoutLoading } = useSelector(state => state.workout);
  const { mealPlanRange, loading: nutritionLoading } = useSelector(state => state.nutrition);

  const [viewMode, setViewMode] = useState('week');
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [showCheatSettings, setShowCheatSettings] = useState(false);

  const visibleDays = useMemo(
    () => (viewMode === 'week' ? getWeekDays(anchorDate) : getMonthGridDays(anchorDate)),
    [viewMode, anchorDate]
  );

  useEffect(() => {
    const from = toDateKey(visibleDays[0]);
    const to = toDateKey(visibleDays[visibleDays.length - 1]);
    dispatch(fetchWorkoutRange({ from, to }));
    dispatch(fetchMealPlanRange({ from, to }));
  }, [dispatch, visibleDays]);

  const workoutForDate = (date) => workoutRange.find(w => isSameDate(w.date, date));
  const mealPlanForDate = (date) => mealPlanRange.find(p => isSameDate(p.date, date));

  const goPrev = () => {
    const d = new Date(anchorDate);
    if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setAnchorDate(d);
  };
  const goNext = () => {
    const d = new Date(anchorDate);
    if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setAnchorDate(d);
  };
  const goToday = () => {
    const now = new Date();
    setAnchorDate(now);
    setSelectedDate(now);
  };

  const handlePlanWeek = async () => {
    const weekStartDate = toDateKey(startOfWeek(anchorDate));
    const results = await Promise.all([
      dispatch(generateWeekOfWorkouts(weekStartDate)),
      dispatch(generateWeekOfMealPlans(weekStartDate))
    ]);
    const failed = results.find(r => r.meta.requestStatus === 'rejected');
    if (failed) {
      toast.error(failed.payload || 'Failed to plan the week');
    } else {
      toast.success('AI planned your whole week — workouts & meals generated!');
    }
  };

  const handleChangeWorkout = async () => {
    const r = await dispatch(generateWorkout({ date: toDateKey(selectedDate) }));
    if (generateWorkout.fulfilled.match(r)) toast.success('Workout changed!');
    else toast.error(r.payload || 'Failed to change workout');
  };

  const handleChangeMeal = async () => {
    const r = await dispatch(generateMealPlan({ date: toDateKey(selectedDate) }));
    if (generateMealPlan.fulfilled.match(r)) toast.success('Meal plan changed!');
    else toast.error(r.payload || 'Failed to change meal plan');
  };

  const cheatDays = user?.preferences?.cheatDays || [];
  const toggleCheatDay = (dayOfWeek) => {
    const existing = cheatDays.find(c => c.dayOfWeek === dayOfWeek);
    const next = existing
      ? cheatDays.filter(c => c.dayOfWeek !== dayOfWeek)
      : [...cheatDays, { dayOfWeek, type: 'full' }];
    dispatch(updateProfile({ preferences: { cheatDays: next } }));
  };
  const setCheatType = (dayOfWeek, type) => {
    const next = cheatDays.map(c => c.dayOfWeek === dayOfWeek ? { ...c, type } : c);
    dispatch(updateProfile({ preferences: { cheatDays: next } }));
  };

  const rangeLabel = viewMode === 'week'
    ? `${visibleDays[0].toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${visibleDays[6].toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
    : anchorDate.toLocaleDateString([], { month: 'long', year: 'numeric' });

  const selectedWorkout = workoutForDate(selectedDate);
  const selectedMealPlan = mealPlanForDate(selectedDate);
  const isGenerating = workoutLoading || nutritionLoading;
  const todayKey = toDateKey(new Date());

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--border-color)] text-xs font-bold">
              Smart Adaptive Calendar
            </span>
            <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">{rangeLabel}</h2>
            <p className="text-xs text-[var(--text-secondary)]">Real workout & meal plan schedule from your account</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] p-1 text-xs font-bold">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${viewMode === 'week' ? 'bg-[var(--accent-primary)] text-slate-950' : 'text-[var(--text-secondary)]'}`}
              >
                <CalendarDays className="w-3.5 h-3.5" /> Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${viewMode === 'month' ? 'bg-[var(--accent-primary)] text-slate-950' : 'text-[var(--text-secondary)]'}`}
              >
                <CalendarRange className="w-3.5 h-3.5" /> Month
              </button>
            </div>

            <button onClick={goPrev} className="p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={goToday} className="px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] text-xs font-bold">
              Today
            </button>
            <button onClick={goNext} className="p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]">
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowCheatSettings(prev => !prev)}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                showCheatSettings ? 'bg-[var(--accent-primary)] text-slate-950 border-transparent' : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]'
              }`}
              title="Configure cheat days"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            <button
              onClick={handlePlanWeek}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 font-bold text-xs shadow-lg flex items-center gap-2 disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" /> {isGenerating ? 'Planning...' : 'Plan My Whole Week'}
            </button>
          </div>
        </div>

        {showCheatSettings && (
          <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-purple-500/40 shadow-2xl space-y-3 animate-in fade-in duration-200">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
              <PartyPopper className="w-4 h-4 text-purple-400" /> Cheat Day Settings
            </h3>
            <p className="text-[11px] text-[var(--text-tertiary)]">Pick recurring days to skip your plan — full cheat, workout-only, or meal-only.</p>
            <div className="grid grid-cols-7 gap-2">
              {DAY_NAMES.map((name, dow) => {
                const config = cheatDays.find(c => c.dayOfWeek === dow);
                return (
                  <div key={dow} className="space-y-1.5">
                    <button
                      onClick={() => toggleCheatDay(dow)}
                      className={`w-full py-2 rounded-xl border text-[10px] font-bold transition-all ${
                        config ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {name.slice(0, 3)}
                    </button>
                    {config && (
                      <select
                        value={config.type}
                        onChange={(e) => setCheatType(dow, e.target.value)}
                        className="w-full text-[9px] p-1 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)]"
                      >
                        <option value="full">Full</option>
                        <option value="workout_only">Workout</option>
                        <option value="meal_only">Meal</option>
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[var(--text-secondary)] pb-2 border-b border-[var(--border-color)]">
              {DAY_LABELS.map(l => <span key={l}>{l}</span>)}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {visibleDays.map((d, idx) => {
                const workout = workoutForDate(d);
                const isToday = isSameDate(d, new Date());
                const isSelected = isSameDate(d, selectedDate);
                const isPast = toDateKey(d) < todayKey;
                const inCurrentMonth = viewMode === 'week' || d.getMonth() === anchorDate.getMonth();

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(d)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between min-h-[75px] transition-all ${
                      isSelected ? 'ring-2 ring-[var(--accent-primary)]' : ''
                    } ${cellTone(workout, isPast, isToday)} ${inCurrentMonth ? '' : 'opacity-40'}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-xs">{d.getDate()}</span>
                      {workout?.isCheatDay && <PartyPopper className="w-3 h-3 text-purple-400" />}
                      {!workout?.isCheatDay && workout && (
                        <span
                          className={`w-2 h-2 rounded-full ${
                            workout.status === 'completed' ? 'bg-emerald-400' : workout.status === 'skipped' ? 'bg-rose-400' : 'bg-amber-400'
                          }`}
                        ></span>
                      )}
                    </div>

                    <span className="text-[10px] font-semibold truncate w-full mt-1">
                      {workout?.isCheatDay ? 'Cheat Day' : workout ? (workout.splitFocus || workout.title) : (isToday ? 'No workout yet' : '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Detail Side Drawer */}
          <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>

            <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-extrabold text-[var(--text-primary)]">
                  <Dumbbell className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Workout
                </div>
                {selectedWorkout && !selectedWorkout.isCheatDay && (
                  <button
                    onClick={handleChangeWorkout}
                    disabled={isGenerating}
                    className="px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--accent-glow)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] border border-[var(--border-color)] text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className="w-3 h-3" /> Change
                  </button>
                )}
              </div>
              {selectedWorkout?.isCheatDay ? (
                <p className="text-purple-300 italic">🎉 {selectedWorkout.cheatMessage}</p>
              ) : selectedWorkout ? (
                <div className="space-y-1">
                  <p className="text-[var(--text-primary)] font-bold">{selectedWorkout.title}</p>
                  <p className="text-[var(--text-secondary)]">{selectedWorkout.splitFocus} &middot; {selectedWorkout.exercises?.length || 0} exercises &middot; {selectedWorkout.status}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[var(--text-tertiary)]">No workout planned for this day.</p>
                  <button
                    onClick={handleChangeWorkout}
                    disabled={isGenerating}
                    className="w-full py-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--accent-glow)] text-[var(--text-primary)] hover:text-[var(--accent-primary)] font-semibold text-xs border border-[var(--border-color)] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Generate Workout
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-extrabold text-[var(--text-primary)]">
                  <Utensils className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Meal Plan
                </div>
                {selectedMealPlan && !selectedMealPlan.isCheatDay && (
                  <button
                    onClick={handleChangeMeal}
                    disabled={isGenerating}
                    className="px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--accent-glow)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] border border-[var(--border-color)] text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className="w-3 h-3" /> Change
                  </button>
                )}
              </div>
              {selectedMealPlan?.isCheatDay ? (
                <p className="text-purple-300 italic">🍔 {selectedMealPlan.cheatMessage}</p>
              ) : selectedMealPlan ? (
                <div className="space-y-1">
                  {selectedMealPlan.meals.map((m, i) => (
                    <p key={i} className="text-[var(--text-secondary)]">
                      <span className="text-[var(--text-primary)] font-bold uppercase text-[10px]">{m.type}:</span> {m.name} ({m.totalCalories} kcal)
                    </p>
                  ))}
                  <p className="text-[var(--text-tertiary)] pt-1">Total: {selectedMealPlan.dailyTotals?.calories} kcal</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[var(--text-tertiary)]">No meal plan for this day.</p>
                  <button
                    onClick={handleChangeMeal}
                    disabled={isGenerating}
                    className="w-full py-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--accent-glow)] text-[var(--text-primary)] hover:text-[var(--accent-primary)] font-semibold text-xs border border-[var(--border-color)] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Generate Meal Plan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
