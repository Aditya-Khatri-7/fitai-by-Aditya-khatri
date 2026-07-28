import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ExerciseCard } from './ExerciseCard';
import { MuscleHeatmap } from './MuscleHeatmap';
import { reshuffleWorkout, selectWorkoutPlan, generateWorkout, fetchTodayWorkout, WORKOUT_PLANS } from '../../redux/slices/workoutSlice';
import { useTheme } from '../../context/ThemeContext';
import { Sparkles, Shuffle, Play, Layers, Filter, RotateCcw, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function WorkoutBuilder({ onStartSession }) {
  const dispatch = useDispatch();
  const { todayWorkout, loading } = useSelector(state => state.workout);
  const { mobileMode } = useTheme();

  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState(null);

  useEffect(() => {
    dispatch(fetchTodayWorkout());
  }, [dispatch]);

  const handleGenerateFirst = () => {
    dispatch(generateWorkout());
  };

  if (!todayWorkout) {
    return (
      <div className="p-10 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center space-y-4">
        <Sparkles className="w-8 h-8 text-[var(--accent-primary)] mx-auto" />
        <h3 className="text-lg font-extrabold text-[var(--text-primary)]">No workout generated yet</h3>
        <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
          Complete your profile and let FitAI generate today's workout based on your real goals, equipment, and any active injuries.
        </p>
        <button
          onClick={handleGenerateFirst}
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-[var(--accent-primary)] text-slate-950 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 mx-auto disabled:opacity-60"
        >
          <Wand2 className="w-4 h-4" /> {loading ? 'Generating...' : 'Generate My Workout'}
        </button>
      </div>
    );
  }

  const primaryMuscles = todayWorkout.exercises?.flatMap(e => e.muscleGroups?.primary || []) || ['chest'];

  // Filter exercises by selected muscle group if active
  const filteredExercises = selectedMuscleFilter
    ? todayWorkout.exercises.filter(e => {
        const primary = (e.muscleGroups?.primary || []).map(m => m.toLowerCase());
        const secondary = (e.muscleGroups?.secondary || []).map(m => m.toLowerCase());
        const filter = selectedMuscleFilter.toLowerCase();
        return primary.some(p => p.includes(filter)) || secondary.some(s => s.includes(filter));
      })
    : todayWorkout.exercises;

  const handlePlanSelect = (e) => {
    const planId = e.target.value;
    dispatch(selectWorkoutPlan(planId));
    setSelectedMuscleFilter(null);
    toast.success('AI Workout Plan & Split Switched!');
  };

  // Body Map Click Handler: AUTOMATICALLY SWITCHES WORKOUT PLAN to match clicked muscle region!
  const handleMuscleClick = (muscleId) => {
    if (!muscleId) {
      setSelectedMuscleFilter(null);
      return;
    }

    const musclePlanMap = {
      chest: 'hypertrophy_upper',
      shoulders: 'hypertrophy_upper',
      back: 'power_pull',
      biceps: 'power_pull',
      abs: 'rehab_core',
      quads: 'legs_titan',
      calves: 'legs_titan'
    };

    const targetPlanId = musclePlanMap[muscleId.toLowerCase()] || 'hypertrophy_upper';
    
    // Switch active workout plan in Redux & localStorage
    dispatch(selectWorkoutPlan(targetPlanId));
    setSelectedMuscleFilter(muscleId);

    toast.success(`AI Generated & Loaded Workout Plan for ${muscleId.toUpperCase()}! 🔥`);
  };

  // Find active plan value for dropdown
  const currentPlanKey = todayWorkout._id === 'plan_pull' ? 'power_pull' :
                         todayWorkout._id === 'plan_legs' ? 'legs_titan' :
                         todayWorkout._id === 'plan_fullbody' ? 'full_body' :
                         todayWorkout._id === 'plan_rehab' ? 'rehab_core' : 'hypertrophy_upper';

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      
      {/* Top Header Controls with Plan Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl">
        <div className="space-y-2 w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--border-color)] text-xs font-bold whitespace-nowrap">
              AI Version {todayWorkout.version}
            </span>
            <span className="text-[var(--text-secondary)] text-xs font-medium">• {todayWorkout.durationTarget} Mins Target</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">{todayWorkout.title}</h2>
          <p className="text-xs text-[var(--text-secondary)] font-semibold">Active Focus: {todayWorkout.splitFocus}</p>
        </div>

        {/* Plan Switcher Dropdown & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          
          {/* Plan Selector */}
          <div className="relative flex items-center">
            <Layers className="w-4 h-4 text-[var(--accent-primary)] absolute left-3 pointer-events-none" />
            <select
              value={currentPlanKey}
              onChange={handlePlanSelect}
              className="w-full sm:w-56 pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-extrabold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer"
            >
              <option value="hypertrophy_upper">🏋️ Hypertrophy Upper Body</option>
              <option value="power_pull">💪 Power Pull & Back Spec</option>
              <option value="legs_titan">🦵 Legs & Posterior Chain Titan</option>
              <option value="full_body">⚡ Full Body Functional Hybrid</option>
              <option value="rehab_core">🧘 Rehab & Core Stability</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                dispatch(reshuffleWorkout());
                toast.success('AI Reshuffled Workout Order!');
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-[var(--border-color)]"
            >
              <Shuffle className="w-4 h-4 text-[var(--accent-primary)]" /> Reshuffle
            </button>

            <button
              onClick={() => {
                if (onStartSession) onStartSession();
                else toast.success('Live Gamified Workout Session Initialized!');
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 text-slate-950 hover:opacity-90 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" /> Start Gamified Session 🔥
            </button>
          </div>
        </div>
      </div>

      {/* Today's Plan At A Glance */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold block">Duration</span>
          <span className="text-sm font-extrabold text-[var(--text-primary)]">{todayWorkout.durationTarget} min</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold block">Exercises</span>
          <span className="text-sm font-extrabold text-[var(--text-primary)]">{todayWorkout.exercises.length}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold block">Status</span>
          <span className="text-sm font-extrabold text-[var(--text-primary)] capitalize">{todayWorkout.status || 'planned'}</span>
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
            <RotateCcw className="w-3.5 h-3.5" /> Show All ({todayWorkout.exercises.length})
          </button>
        </div>
      )}

      {/* Main Content Layout (1 Column in mobileMode, 3 Cols on Desktop) */}
      <div className={`grid grid-cols-1 ${mobileMode ? 'grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
        
        {/* Exercises List (2 cols on desktop, 1 col on mobile) */}
        <div className={`${mobileMode ? 'col-span-1' : 'lg:col-span-2'} space-y-4`}>
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)]">
            <span>EXERCISES IN SESSION ({filteredExercises.length} of {todayWorkout.exercises.length})</span>
            <span className="text-[var(--accent-primary)]">Adaptive Safety Active</span>
          </div>

          <div className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 -mx-1 px-1">
            {filteredExercises.length > 0 ? (
              filteredExercises.map((ex, idx) => (
                <div key={idx} className="shrink-0 w-[86%] sm:w-[420px] snap-center">
                  <ExerciseCard exercise={ex} index={idx} />
                </div>
              ))
            ) : (
              <div className="p-8 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center space-y-3">
                <p className="text-xs text-[var(--text-secondary)] font-semibold">
                  No exercises in this split specifically target <span className="text-[var(--accent-primary)] font-bold uppercase">{selectedMuscleFilter}</span>.
                </p>
                <button
                  onClick={() => setSelectedMuscleFilter(null)}
                  className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-slate-950 font-extrabold text-xs"
                >
                  View Full Workout ({todayWorkout.exercises.length} Exercises)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Heatmap & AI Context Sidebar */}
        <div className="space-y-4">
          <MuscleHeatmap
            activeMuscles={primaryMuscles}
            selectedFilter={selectedMuscleFilter}
            onSelectMuscle={handleMuscleClick}
          />

          <div className="p-5 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" /> ADAPTIVE LOGIC REASONING
            </h4>
            <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
              {todayWorkout.aiExplanation}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
