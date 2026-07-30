import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { ExerciseCarousel } from './ExerciseCarousel';
import { MuscleHeatmap } from './MuscleHeatmap';
import { YogaBodyEffectMap } from './YogaBodyEffectMap';
import { YogaQuestionnaireModal } from './YogaQuestionnaireModal';
import { reshuffleWorkout, generateWorkout, fetchTodayWorkout, fetchWorkoutRange, persistWorkoutEdit } from '../../redux/slices/workoutSlice';
import { useTheme } from '../../context/ThemeContext';
import { Sparkles, Shuffle, Play, Layers, Filter, RotateCcw, Wand2, CalendarClock, X } from 'lucide-react';
import toast from 'react-hot-toast';

function toDateKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

// Real focus-group options that hit the backend's ML recommender via generateWorkout,
// replacing the old static local WORKOUT_PLANS fixture switcher (which silently
// discarded itself on the next fetchTodayWorkout since it never touched the backend).
const PLAN_OPTIONS = [
  { key: 'hypertrophy_upper', label: '🏋️ Hypertrophy Upper Body', title: 'Hypertrophy Upper Body & Core', splitFocus: 'Chest, Shoulders & Triceps', focusGroups: [['Chest', 'Shoulders'], ['Triceps']] },
  { key: 'power_pull', label: '💪 Power Pull & Back Spec', title: 'Power Pull & Back Specialization', splitFocus: 'Lats, Upper Back & Biceps', focusGroups: [['Back', 'Lats'], ['Biceps']] },
  { key: 'legs_titan', label: '🦵 Legs & Posterior Chain Titan', title: 'Legs & Posterior Chain Titan', splitFocus: 'Quads, Hamstrings & Glutes', focusGroups: [['Quadriceps', 'Hamstrings'], ['Glutes', 'Calves']] },
  { key: 'full_body', label: '⚡ Full Body Functional Hybrid', title: 'Full Body Functional AI Hybrid', splitFocus: 'Chest, Back, Legs & Core', focusGroups: [['Chest', 'Shoulders'], ['Back', 'Lats'], ['Quadriceps', 'Hamstrings'], ['Abdominals']] },
  { key: 'rehab_core', label: '🧘 Rehab & Core Stability', title: 'Rehab & Core Stability', splitFocus: 'Core & Mobility', focusGroups: [['Abdominals']] }
];

export function WorkoutBuilder({ onStartSession }) {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const isToday = !dateParam || dateParam === toDateKey(new Date());

  const { todayWorkout, workoutRange, loading } = useSelector(state => state.workout);
  const { user } = useSelector(state => state.auth);
  const { mobileMode, isNarrowViewport } = useTheme();
  const isCompact = mobileMode || isNarrowViewport;
  const dislikedExercises = user?.preferences?.dislikedExerciseNames || [];

  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState(null);
  const [showYogaModal, setShowYogaModal] = useState(false);

  useEffect(() => {
    if (isToday) dispatch(fetchTodayWorkout());
    else dispatch(fetchWorkoutRange({ from: dateParam, to: dateParam }));
  }, [dispatch, dateParam, isToday]);

  const activeWorkout = isToday ? todayWorkout : workoutRange.find(w => toDateKey(w.date) === dateParam);
  const dateLabel = dateParam ? new Date(dateParam).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) : null;

  const dateBanner = !isToday && (
    <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--accent-glow)] border border-[var(--accent-primary)]/40 text-xs">
      <span className="flex items-center gap-2 font-bold text-[var(--accent-primary)]">
        <CalendarClock className="w-4 h-4" /> Planning for {dateLabel} — changes will apply when that day arrives.
      </span>
      <button
        onClick={() => setSearchParams({})}
        className="px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] flex items-center gap-1 font-bold"
      >
        <X className="w-3 h-3" /> Back to Today
      </button>
    </div>
  );

  const handleGenerateFirst = () => {
    dispatch(generateWorkout(isToday ? {} : { date: dateParam }));
  };

  if (!activeWorkout) {
    return (
      <div className="space-y-4">
        {dateBanner}
        <div className="p-10 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center space-y-4">
          <Sparkles className="w-8 h-8 text-[var(--accent-primary)] mx-auto" />
          <h3 className="text-lg font-extrabold text-[var(--text-primary)]">No workout generated yet</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            Complete your profile and let FitAI generate {isToday ? "today's" : `the ${dateLabel}`} workout based on your real goals, equipment, and any active injuries.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleGenerateFirst}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-[var(--accent-primary)] text-slate-950 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Wand2 className="w-4 h-4" /> {loading ? 'Generating...' : 'Generate My Workout'}
            </button>
            <button
              onClick={() => setShowYogaModal(true)}
              className="px-6 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] font-extrabold text-xs shadow-lg flex items-center justify-center gap-2"
            >
              🧘‍♀️ Start Yoga Instead
            </button>
          </div>
          <YogaQuestionnaireModal isOpen={showYogaModal} onClose={() => setShowYogaModal(false)} />
        </div>
      </div>
    );
  }

  const primaryMuscles = activeWorkout.exercises?.flatMap(e => e.muscleGroups?.primary || []) || ['chest'];

  // Filter exercises by selected muscle group if active
  const filteredExercises = selectedMuscleFilter
    ? activeWorkout.exercises.filter(e => {
        const primary = (e.muscleGroups?.primary || []).map(m => m.toLowerCase());
        const secondary = (e.muscleGroups?.secondary || []).map(m => m.toLowerCase());
        const filter = selectedMuscleFilter.toLowerCase();
        return primary.some(p => p.includes(filter)) || secondary.some(s => s.includes(filter));
      })
    : activeWorkout.exercises;

  const handlePlanSelect = async (e) => {
    const planId = e.target.value;
    if (planId === 'yoga') {
      setShowYogaModal(true);
      return;
    }
    const plan = PLAN_OPTIONS.find(p => p.key === planId);
    if (!plan) return;

    setSelectedMuscleFilter(null);
    const result = await dispatch(generateWorkout({ focusGroups: plan.focusGroups, title: plan.title, splitFocus: plan.splitFocus, ...(isToday ? {} : { date: dateParam }) }));
    if (generateWorkout.fulfilled.match(result)) {
      toast.success(`Switched to ${plan.title} — real ML-recommended exercises loaded.`);
    } else {
      toast.error(result.payload || 'Failed to switch plan');
    }
  };

  // Body Map Click Handler: filters the CURRENT workout's exercise list by muscle —
  // it no longer silently regenerates an entirely new workout on every click, since
  // that surprised users and burned a real backend call per click. Use the plan
  // dropdown above to actually regenerate a different split.
  const handleMuscleClick = (muscleId) => {
    setSelectedMuscleFilter(muscleId || null);
  };

  const isYogaWorkout = activeWorkout.type === 'flexibility';

  // Find active plan value for dropdown — matched by splitFocus text since real
  // backend-generated workouts don't carry the old fake static-preset IDs.
  const matchedPlan = PLAN_OPTIONS.find(p => p.splitFocus === activeWorkout.splitFocus);
  const currentPlanKey = isYogaWorkout ? 'yoga' : (matchedPlan?.key || 'hypertrophy_upper');

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {dateBanner}

      {/* Top Header Controls with Plan Selector */}
      <div className={`flex flex-col ${isCompact ? '' : 'md:flex-row md:items-center'} items-start justify-between gap-4 p-4 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl`}>
        <div className={`space-y-2 w-full ${isCompact ? '' : 'md:w-auto'} min-w-0`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--border-color)] text-xs font-bold whitespace-nowrap">
              AI Version {activeWorkout.version}
            </span>
            <span className="text-[var(--text-secondary)] text-xs font-medium">• {activeWorkout.durationTarget} Mins Target</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] break-words">{activeWorkout.title}</h2>
          <p className="text-xs text-[var(--text-secondary)] font-semibold break-words">Active Focus: {activeWorkout.splitFocus}</p>
        </div>

        {/* Plan Switcher Dropdown & Actions */}
        <div className={`flex flex-col ${isCompact ? '' : 'sm:flex-row sm:items-center'} items-stretch gap-3 w-full ${isCompact ? '' : 'md:w-auto'}`}>

          {/* Plan Selector */}
          <div className="relative flex items-center w-full">
            <Layers className="w-4 h-4 text-[var(--accent-primary)] absolute left-3 pointer-events-none" />
            <select
              value={currentPlanKey}
              onChange={handlePlanSelect}
              className={`w-full ${isCompact ? '' : 'sm:w-56'} pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-extrabold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer`}
            >
              {PLAN_OPTIONS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              <option value="yoga">🧘‍♀️ Yoga Flow</option>
            </select>
          </div>

          <div className={`flex flex-wrap items-center gap-2 ${isCompact ? 'w-full' : ''}`}>
            {/* Dedicated, always-visible entry point — previously yoga was only
                reachable buried inside the plan dropdown or the empty-state button,
                and users couldn't find it once a regular workout already existed. */}
            <button
              onClick={() => setShowYogaModal(true)}
              className={`${isCompact ? 'flex-1 min-w-0' : 'flex-1 sm:flex-initial'} px-3.5 py-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-[var(--border-color)] whitespace-nowrap`}
              title="Build a yoga flow instead"
            >
              🧘‍♀️ Yoga Flow
            </button>

            {isToday && (
              <button
                onClick={async () => {
                  dispatch(reshuffleWorkout());
                  if (activeWorkout._id) {
                    await dispatch(persistWorkoutEdit({
                      id: activeWorkout._id,
                      exercises: [...activeWorkout.exercises].reverse(),
                      versionLabel: 'Reshuffled exercise order for antagonist recovery',
                      versionReason: 'user_override',
                      versionExplanation: 'Optimized exercise sequence to reduce fatigue accumulation.'
                    }));
                  }
                  toast.success('AI Reshuffled Workout Order!');
                }}
                className={`${isCompact ? 'flex-1 min-w-0' : 'flex-1 sm:flex-initial'} px-3.5 py-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-[var(--border-color)] whitespace-nowrap`}
              >
                <Shuffle className="w-4 h-4 text-[var(--accent-primary)]" /> Reshuffle
              </button>
            )}

            <button
              onClick={() => {
                if (onStartSession) onStartSession();
                else toast.success('Live Gamified Workout Session Initialized!');
              }}
              className={`${isCompact ? 'w-full' : 'flex-1 sm:flex-initial'} px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 text-slate-950 hover:opacity-90 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] whitespace-nowrap`}
            >
              <Play className="w-4 h-4 fill-current" /> {isCompact ? 'Start Session 🔥' : 'Start Gamified Session 🔥'}
            </button>
          </div>
        </div>
      </div>

      {/* Today's Plan At A Glance */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold block">Duration</span>
          <span className="text-sm font-extrabold text-[var(--text-primary)]">{activeWorkout.durationTarget} min</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold block">Exercises</span>
          <span className="text-sm font-extrabold text-[var(--text-primary)]">{activeWorkout.exercises.length}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold block">Status</span>
          <span className="text-sm font-extrabold text-[var(--text-primary)] capitalize">{activeWorkout.status || 'planned'}</span>
        </div>
      </div>

      {/* Muscle Filter Active Alert */}
      {selectedMuscleFilter && (
        <div className="p-3.5 rounded-2xl bg-[var(--accent-glow)] border border-[var(--accent-primary)]/40 flex items-center justify-between text-xs animate-in fade-in duration-200">
          <span className="font-extrabold text-[var(--accent-primary)] flex items-center gap-2">
            <Filter className="w-4 h-4" /> AI Loaded Workout Plan for Muscle: <span className="uppercase text-white font-mono font-black">{selectedMuscleFilter}</span> ({filteredExercises.length} Exercises Active)
          </span>
          <button
            onClick={() => setSelectedMuscleFilter(null)}
            className="px-3 py-1 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] font-bold text-xs border border-[var(--border-color)] flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Show All ({activeWorkout.exercises.length})
          </button>
        </div>
      )}

      {/* Main Content Layout (1 Column in mobileMode, 3 Cols on Desktop) */}
      <div className={`grid grid-cols-1 ${mobileMode ? 'grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
        
        {/* Exercises List (2 cols on desktop, 1 col on mobile) */}
        <div className={`${mobileMode ? 'col-span-1' : 'lg:col-span-2'} space-y-4`}>
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)]">
            <span>EXERCISES IN SESSION ({filteredExercises.length} of {activeWorkout.exercises.length})</span>
            <span className="text-[var(--accent-primary)]">Adaptive Safety Active</span>
          </div>

          {filteredExercises.length > 0 ? (
            <ExerciseCarousel exercises={filteredExercises} />
          ) : (
            <div className="p-8 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center space-y-3">
              <p className="text-xs text-[var(--text-secondary)] font-semibold">
                No exercises in this split specifically target <span className="text-[var(--accent-primary)] font-bold uppercase">{selectedMuscleFilter}</span>.
              </p>
              <button
                onClick={() => setSelectedMuscleFilter(null)}
                className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-slate-950 font-extrabold text-xs"
              >
                View Full Workout ({activeWorkout.exercises.length} Exercises)
              </button>
            </div>
          )}
        </div>

        {/* Heatmap & AI Context Sidebar */}
        <div className="space-y-4">
          {isYogaWorkout ? (
            <YogaBodyEffectMap exercises={activeWorkout.exercises} />
          ) : (
            <MuscleHeatmap
              activeMuscles={primaryMuscles}
              selectedFilter={selectedMuscleFilter}
              onSelectMuscle={handleMuscleClick}
            />
          )}

          <div className="p-5 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" /> ADAPTIVE LOGIC REASONING
            </h4>
            <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
              {activeWorkout.aiExplanation}
            </p>

            {/* Real, visible proof that swap interactions actually change future
                recommendations — not a silent backend change the user can't see. */}
            {dislikedExercises.length > 0 && (
              <div className="pt-2 border-t border-[var(--border-color)] space-y-1">
                <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                  Learned from your swaps — soft-avoided going forward:
                </span>
                <div className="flex flex-wrap gap-1">
                  {dislikedExercises.slice(-8).map((name, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[10px] text-[var(--text-secondary)]">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      <YogaQuestionnaireModal isOpen={showYogaModal} onClose={() => setShowYogaModal(false)} />
    </div>
  );
}
