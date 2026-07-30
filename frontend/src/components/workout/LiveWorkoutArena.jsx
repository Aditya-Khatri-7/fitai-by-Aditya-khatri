import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addXp, setVictoryDrop } from '../../redux/slices/gamificationSlice';
import { updateWorkoutStatusRemote, fetchStreakState } from '../../redux/slices/workoutSlice';
import { toSteps } from '../../utils/exerciseSteps';
import { useTheme } from '../../context/ThemeContext';
import { WorkoutVictoryModal } from './WorkoutVictoryModal';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Flame,
  Zap,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Dumbbell,
  Timer,
  Volume2,
  VolumeX,
  X,
  ListOrdered
} from 'lucide-react';
import toast from 'react-hot-toast';

// Helper function to synthesize web audio chimes without relying on external media files
const playSoundChime = (type = 'complete') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'complete') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'timer_done') {
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (err) {
    console.log('Audio playback error:', err);
  }
};

export function LiveWorkoutArena({ onClose }) {
  const dispatch = useDispatch();
  const { todayWorkout } = useSelector(state => state.workout);
  const { soundEnabled } = useSelector(state => state.gamification);
  const { mobileMode, isNarrowViewport } = useTheme();
  const isCompact = mobileMode || isNarrowViewport;

  const exercises = todayWorkout?.exercises || [
    { name: 'Barbell Bench Press', targetSets: 4, targetReps: '8-10', defaultWeight: 75, muscle: 'Chest' },
    { name: 'Incline Dumbbell Flyes', targetSets: 3, targetReps: '12', defaultWeight: 20, muscle: 'Chest' },
    { name: 'Cable Tricep Pushdown', targetSets: 4, targetReps: '12-15', defaultWeight: 35, muscle: 'Triceps' }
  ];

  const [activeExIdx, setActiveExIdx] = useState(0);
  const [completedSets, setCompletedSets] = useState({});
  const [weights, setWeights] = useState({});
  const [reps, setReps] = useState({});
  const [combo, setCombo] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalReps, setTotalReps] = useState(0);

  // Rest Timer State
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);

  const currentExercise = exercises[activeExIdx] || exercises[0];

  // Rest Timer Countdown Interval — auto-loops into the next set's timer
  // instead of just stopping at 0, so rest keeps flowing between sets without
  // needing a manual "Start Rest" tap every time.
  useEffect(() => {
    let timer = null;
    if (isRestTimerActive && restTimeLeft > 0) {
      timer = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            if (soundEnabled) playSoundChime('timer_done');
            toast.success('REST TIME UP! Next Set Ready 🔥', { icon: '⏰' });
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRestTimerActive, restTimeLeft, soundEnabled]);

  // Auto-advance to the next exercise once every set of the current one is
  // checked off, instead of leaving the stepper stuck on "1 / N" after
  // finishing all sets. `autoAdvancedRef` stops it from repeatedly shoving the
  // user forward if they manually navigate back to an already-completed one.
  const autoAdvancedRef = useRef(new Set());
  const allSetsDone = useMemo(() => {
    const totalSets = currentExercise.targetSets || 4;
    return Array.from({ length: totalSets }).every((_, i) => completedSets[`${activeExIdx}_${i}`]);
  }, [completedSets, activeExIdx, currentExercise.targetSets]);

  useEffect(() => {
    if (!allSetsDone) return;
    if (activeExIdx >= exercises.length - 1) return;
    if (autoAdvancedRef.current.has(activeExIdx)) return;
    autoAdvancedRef.current.add(activeExIdx);

    const nextExercise = exercises[activeExIdx + 1];
    const timeout = setTimeout(() => {
      setActiveExIdx(activeExIdx + 1);
      toast.success(`Exercise complete! Moving to ${nextExercise.name} 💪`);
    }, 900);
    return () => clearTimeout(timeout);
  }, [allSetsDone, activeExIdx, exercises]);

  const handleToggleSet = (exIdx, setIdx) => {
    const key = `${exIdx}_${setIdx}`;
    const isAlreadyDone = completedSets[key];

    if (!isAlreadyDone) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      const bonusXp = 50 + nextCombo * 10;
      setTotalXpEarned(prev => prev + bonusXp);

      const w = weights[key] || currentExercise.defaultWeight || 60;
      const r = reps[key] || 10;
      setTotalVolume(prev => prev + w * r);
      setTotalReps(prev => prev + r);

      setCompletedSets(prev => ({ ...prev, [key]: true }));

      if (soundEnabled) playSoundChime('complete');
      toast.success(`Set ${setIdx + 1} Complete! +${bonusXp} XP (${nextCombo}x Combo 🔥)`);

      // Start 60s Rest Timer
      setRestTimeLeft(60);
      setIsRestTimerActive(true);
    } else {
      setCompletedSets(prev => ({ ...prev, [key]: false }));
      setCombo(Math.max(0, combo - 1));
    }
  };

  const handleFinishWorkout = async () => {
    const finalXp = totalXpEarned + 200; // Workout completion bonus
    dispatch(addXp(finalXp));
    dispatch(setVictoryDrop({
      title: todayWorkout?.title || 'Hypertrophy Power Session',
      xpEarned: finalXp,
      maxCombo: Math.max(combo, 1),
      totalVolume: totalVolume || 3850
    }));

    // This is the write that actually moves the streak — without it, finishing a
    // live session never touches the backend workout status, so applyStreakUpdate
    // (triggered server-side only on status:'completed') never fires.
    if (todayWorkout?._id) {
      const result = await dispatch(updateWorkoutStatusRemote({ id: todayWorkout._id, status: 'completed', totalReps }));
      if (updateWorkoutStatusRemote.fulfilled.match(result)) {
        dispatch(fetchStreakState());
      } else {
        toast.error('Workout XP saved, but streak update failed — try refreshing.');
      }
    }
  };

  const isBossFightSet = (currentExercise.defaultWeight || 60) >= 80;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl text-slate-100 flex flex-col p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-300">
      
      {/* Top Header Control Bar */}
      <div className={`flex ${isCompact ? 'flex-col gap-3' : 'items-center justify-between'} pb-4 border-b border-slate-800`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--border-color)] flex items-center justify-center font-extrabold text-lg shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider">
                LIVE GAMIFIED ARENA
              </span>
              {isBossFightSet && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 animate-pulse">
                  ⚔️ PR BOSS BATTLE
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-white truncate">{todayWorkout?.title || 'Live Workout Session'}</h2>
          </div>
        </div>

        {/* Live HUD Stats */}
        <div className={`flex items-center gap-2 ${isCompact ? 'justify-between' : 'gap-3'}`}>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="text-xs font-mono font-extrabold text-rose-400 whitespace-nowrap">{combo}x Combo</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-mono font-extrabold text-amber-400 whitespace-nowrap">+{totalXpEarned} XP</span>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className={`flex-1 grid grid-cols-1 gap-6 py-6 ${isCompact ? '' : 'lg:grid-cols-3'}`}>
        
        {/* Left 2 Cols: Exercise Tracker & Interactive Set Matrix */}
        <div className={`space-y-6 ${isCompact ? '' : 'lg:col-span-2'}`}>

          {/* Exercise Stepper — prev/next through one exercise at a time instead
              of a horizontal-scroll strip that gets cut off at the screen edge
              on mobile. */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveExIdx(i => Math.max(0, i - 1))}
              disabled={activeExIdx === 0}
              className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex-1 flex items-center justify-center gap-1.5">
              {exercises.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveExIdx(idx)}
                  aria-label={`Go to exercise ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === activeExIdx ? 'w-6 bg-[var(--accent-primary)]' : 'w-1.5 bg-slate-800 hover:bg-slate-700'
                  }`}
                />
              ))}
            </div>

            <span className="text-[10px] font-bold text-slate-400 font-mono shrink-0">
              {activeExIdx + 1} / {exercises.length}
            </span>

            <button
              onClick={() => setActiveExIdx(i => Math.min(exercises.length - 1, i + 1))}
              disabled={activeExIdx === exercises.length - 1}
              className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Current Active Exercise Card */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
            
            {/* PR Boss Fight Alert Banner */}
            {isBossFightSet && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/80 to-amber-950/80 border border-rose-500/40 space-y-1">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500" /> DYNAMIC PR BOSS CHALLENGE ACTIVE
                </span>
                <p className="text-xs font-semibold text-rose-200">
                  Hit all {currentExercise.targetSets} sets at {currentExercise.defaultWeight || 75}kg to defeat the Heavy Overload Boss and claim +150 Bonus XP!
                </p>
              </div>
            )}

            <div className="flex justify-between items-start">
              <div>
                <span className="px-3 py-1 rounded-full bg-slate-800 text-[var(--accent-primary)] font-extrabold text-[10px] uppercase tracking-wider">
                  TARGET MUSCLE: {currentExercise.muscle || 'Primary Chest'}
                </span>
                <h3 className="text-2xl font-extrabold text-white mt-2">{currentExercise.name}</h3>
                <p className="text-xs text-slate-400 mt-1">Recommended Tempo: 3s Eccentric • 1s Pause • Explosive Concentric</p>
              </div>
            </div>

            {/* Real step-by-step instructions — previously entirely absent from the
                live session, forcing users to guess form mid-set. */}
            {toSteps(currentExercise.instructions).length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> How To Perform
                </span>
                <ol className="space-y-1.5 text-xs">
                  {toSteps(currentExercise.instructions).map((step, i) => (
                    <li key={i} className="flex gap-2 text-slate-300">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-[var(--accent-primary)] font-bold flex items-center justify-center text-[9px] shrink-0 mt-0.5">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Set Tracking Interactive Table */}
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2">
                <span className="col-span-2">SET</span>
                <span className="col-span-4">WEIGHT (KG)</span>
                <span className="col-span-4">REPS</span>
                <span className="col-span-2 text-right">ACTION</span>
              </div>

              {Array.from({ length: currentExercise.targetSets || 4 }).map((_, setIdx) => {
                const key = `${activeExIdx}_${setIdx}`;
                const isDone = completedSets[key];
                const currentWeight = weights[key] || currentExercise.defaultWeight || 60;
                const currentRep = reps[key] || 10;

                return (
                  <div
                    key={setIdx}
                    className={`grid grid-cols-12 gap-2 items-center p-3 rounded-2xl border transition-all ${
                      isDone
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="col-span-2 text-xs font-mono font-extrabold flex items-center gap-1.5">
                      Set {setIdx + 1}
                    </span>

                    {/* Weight Controls */}
                    <div className="col-span-4 flex items-center gap-1">
                      <button
                        onClick={() => setWeights({ ...weights, [key]: Math.max(0, currentWeight - 2.5) })}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 font-extrabold text-xs text-slate-200"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={currentWeight}
                        onChange={(e) => setWeights({ ...weights, [key]: Number(e.target.value) })}
                        className="w-16 text-center py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-white focus:outline-none"
                      />
                      <button
                        onClick={() => setWeights({ ...weights, [key]: currentWeight + 2.5 })}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 font-extrabold text-xs text-slate-200"
                      >
                        +
                      </button>
                    </div>

                    {/* Rep Controls */}
                    <div className="col-span-4 flex items-center gap-1">
                      <button
                        onClick={() => setReps({ ...reps, [key]: Math.max(1, currentRep - 1) })}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 font-extrabold text-xs text-slate-200"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={currentRep}
                        onChange={(e) => setReps({ ...reps, [key]: Number(e.target.value) })}
                        className="w-16 text-center py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-white focus:outline-none"
                      />
                      <button
                        onClick={() => setReps({ ...reps, [key]: currentRep + 1 })}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 font-extrabold text-xs text-slate-200"
                      >
                        +
                      </button>
                    </div>

                    {/* Set Complete Check Button */}
                    <div className="col-span-2 text-right">
                      <button
                        onClick={() => handleToggleSet(activeExIdx, setIdx)}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isDone
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg font-bold'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-[var(--accent-primary)] hover:text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Rest Timer & Session Finish Sidebar */}
        <div className="space-y-6">
          
          {/* Rest Countdown Timer Card — compact horizontal layout on mobile
              instead of a large circular dial that ate most of the screen. */}
          <div className={`rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-3 ${isCompact ? 'p-4' : 'p-6 text-center space-y-4'}`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-[var(--accent-primary)]" /> SET REST TIMER
              </span>
              <span className="font-mono text-[var(--accent-primary)]">60s Standard</span>
            </div>

            {isCompact ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-3xl font-extrabold font-mono text-white">{restTimeLeft}s</span>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (!isRestTimerActive && restTimeLeft <= 0) setRestTimeLeft(60);
                      setIsRestTimerActive(!isRestTimerActive);
                    }}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
                  >
                    {isRestTimerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { setRestTimeLeft(60); setIsRestTimerActive(false); }}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Circular Rest Time Visualizer */}
                <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                  <div className="w-full h-full rounded-full border-4 border-slate-800 flex items-center justify-center">
                    <span className="text-4xl font-extrabold font-mono text-white">
                      {restTimeLeft}s
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!isRestTimerActive && restTimeLeft <= 0) setRestTimeLeft(60);
                      setIsRestTimerActive(!isRestTimerActive);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-white flex items-center justify-center gap-1.5"
                  >
                    {isRestTimerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isRestTimerActive ? 'Pause' : 'Start Rest'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setRestTimeLeft(60);
                      setIsRestTimerActive(false);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Session Summary Card */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">SESSION REAL-TIME STATS</h4>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 font-semibold">Total Session Volume</span>
                <span className="font-extrabold font-mono text-white">{totalVolume} kg</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 font-semibold">XP Multiplier Active</span>
                <span className="font-extrabold font-mono text-amber-400">1.25x Overload Boost</span>
              </div>
            </div>

            <button
              onClick={handleFinishWorkout}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 text-slate-950 font-extrabold text-sm shadow-2xl hover:opacity-90 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
            >
              <Trophy className="w-5 h-5" />
              <span>FINISH WORKOUT & CLAIM LOOT</span>
            </button>
          </div>

        </div>

      </div>

      <WorkoutVictoryModal onClose={onClose} />
    </div>
  );
}
