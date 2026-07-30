import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { generateWorkout, persistWorkoutEdit } from '../../redux/slices/workoutSlice';
import { calculateRecoveryScore } from '../../utils/recoveryCalculator';
import { useSpeech } from '../../hooks/useSpeech';
import { Sparkles, Volume2, VolumeX, Flame, Zap, Dumbbell, Activity, X } from 'lucide-react';
import toast from 'react-hot-toast';

export function ProactiveAIHUD({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const location = useLocation();

  const { todayWorkout } = useSelector(state => state.workout);
  const { user } = useSelector(state => state.auth);
  const { todayMetrics } = useSelector(state => state.health);
  const { level, rankTitle } = useSelector(state => state.gamification);
  const streak = user?.streak?.current ?? 0;
  const recovery = calculateRecoveryScore(todayMetrics, user);

  const { speak: speakUtterance } = useSpeech();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [currentAdvice, setCurrentAdvice] = useState('');

  // Generate Contextual Advice based on current route & user state
  useEffect(() => {
    let adviceText = '';
    const path = location.pathname;

    if (path.includes('workouts')) {
      adviceText = `Greetings ${user?.name || 'Warrior'}! I'm watching your training setup. You're currently targeting ${todayWorkout?.splitFocus || 'Upper Body'}. If you're short on time today, click below to compress rest intervals by 30% or switch splits!`;
    } else if (path.includes('profile')) {
      adviceText = `Level ${level} ${rankTitle}! Your 5-axis RPG character radar shows high consistency. Keep pushing your Personal Record Hall of Fame to unlock Tier 4 Skill Perks!`;
    } else if (path.includes('nutrition')) {
      adviceText = `Fuel Management Active! Your daily macro target is structured to optimize muscle hypertrophy while keeping recovery high. Remember to drink 3.5 liters of water today!`;
    } else if (path.includes('health')) {
      const hr = todayMetrics?.heartRate?.resting;
      const recoveryText = recovery.isUncalibrated ? 'not yet calibrated — sync a wearable to enable it' : `${recovery.score}%`;
      adviceText = `Biometric Health Diagnostics Active! Recovery score is ${recoveryText}.${hr ? ` Resting heart rate is ${hr} bpm.` : ''} ${!recovery.isUncalibrated && recovery.score >= 75 ? 'Everything is optimal for heavy training!' : ''}`;
    } else {
      const recoveryText = recovery.isUncalibrated ? 'not yet calibrated' : `${recovery.score}%`;
      adviceText = `Welcome back! You are on a ${streak}-Day Training Streak! Today's AI recovery score is ${recoveryText}. Start your daily workout session to claim +250 XP!`;
    }

    setCurrentAdvice(adviceText);

    if (isOpen && speechEnabled) {
      const utterance = speakUtterance(adviceText);
      if (utterance) {
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
      }
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen, location.pathname, todayWorkout]);

  const handleSpeakToggle = () => {
    if (speechEnabled) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setSpeechEnabled(false);
      toast.success('AI Voice Muted');
    } else {
      setSpeechEnabled(true);
      toast.success('AI Live Voice Speech Activated');
    }
  };

  const handleMotivateMe = () => {
    const quotes = [
      "No shortcuts, no excuses! Every single rep brings you closer to cyber legend rank!",
      "Your recovery score is optimal and your muscles are primed. Let's make today count!",
      "Consistency beats motivation every time! Crush today's set targets!",
      "Pain is temporary, level-up glory is forever! Let's get to work!"
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setCurrentAdvice(randomQuote);

    if (speechEnabled) {
      const utterance = speakUtterance(randomQuote);
      if (utterance) {
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
      }
    }
  };

  const handleCondenseWorkout = async () => {
    if (todayWorkout?._id) {
      const result = await dispatch(persistWorkoutEdit({
        id: todayWorkout._id,
        durationTarget: 25,
        aiExplanation: 'Condensed workout duration to 25 mins by reducing rest intervals to 45s and increasing set tempo.',
        versionLabel: 'Condensed workout to 25 min target',
        versionReason: 'ai_adaptation',
        versionExplanation: 'Condensed workout duration to 25 mins by reducing rest intervals to 45s and increasing set tempo.'
      }));
      if (persistWorkoutEdit.fulfilled.match(result)) {
        toast.success('⚡ AI Condensed Workout to 25 Mins Target on Dashboard!');
      } else {
        toast.error(result.payload || 'Failed to condense workout');
      }
      if (onClose) onClose();
    }
  };

  const SPLIT_FOCUS_GROUPS = {
    legs_titan: { focusGroups: [['Quadriceps', 'Hamstrings'], ['Glutes', 'Calves']], title: 'Legs & Posterior Chain Titan', splitFocus: 'Quads, Hamstrings & Glutes' },
    hypertrophy_upper: { focusGroups: [['Chest', 'Shoulders'], ['Triceps']], title: 'Hypertrophy Upper Body & Core', splitFocus: 'Chest, Shoulders & Triceps' }
  };

  const handleSwitchSplit = async (planId, name) => {
    const plan = SPLIT_FOCUS_GROUPS[planId];
    if (!plan) return;
    const result = await dispatch(generateWorkout(plan));
    if (generateWorkout.fulfilled.match(result)) {
      toast.success(`💪 Dashboard Workout Split Switched to ${name}!`);
    } else {
      toast.error(result.payload || 'Failed to switch split');
    }
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 w-auto sm:w-80 md:w-96 p-4 sm:p-5 rounded-3xl bg-[var(--bg-secondary)] border-2 border-[var(--accent-primary)] shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
      
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-glow)] flex items-center justify-center text-[var(--accent-primary)] font-black border border-[var(--accent-primary)]/40 shadow">
            <Sparkles className="w-4 h-4 text-[var(--accent-primary)] animate-spin-slow" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-[var(--text-primary)]">PROACTIVE AI VISION HUD</h4>
            <span className="text-[10px] text-[var(--accent-primary)] font-mono font-bold flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              {isSpeaking ? 'SPEAKING LIVE...' : 'REALTIME VISION ACTIVE'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSpeakToggle}
            className={`p-1.5 rounded-xl border transition-all ${
              speechEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
            }`}
            title={speechEnabled ? 'Mute AI Voice' : 'Unmute AI Voice'}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Speech Bubble */}
      <div className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
        <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed italic">
          "{currentAdvice}"
        </p>
      </div>

      {/* Real Dashboard Drift Action Buttons */}
      <div className="space-y-2 pt-1">
        <span className="text-[10px] font-extrabold text-[var(--text-tertiary)] uppercase tracking-wider block">
          CLICK TO EXECUTE REAL DASHBOARD ACTIONS:
        </span>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={handleMotivateMe}
            className="py-2 px-3 rounded-xl bg-[var(--accent-glow)] text-[var(--accent-primary)] font-extrabold border border-[var(--accent-primary)]/40 hover:bg-[var(--accent-primary)] hover:text-slate-950 transition-all flex items-center justify-center gap-1.5 shadow"
          >
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" /> Motivate Me!
          </button>

          <button
            onClick={handleCondenseWorkout}
            className="py-2 px-3 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 text-slate-950 font-extrabold shadow hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
          >
            <Zap className="w-4 h-4 fill-current" /> Condense 20Mins
          </button>

          <button
            onClick={() => handleSwitchSplit('legs_titan', 'Legs Titan Split')}
            className="py-2 px-3 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] font-extrabold border border-[var(--border-color)] transition-all flex items-center justify-center gap-1.5"
          >
            <Dumbbell className="w-4 h-4 text-purple-400" /> Switch Legs Split
          </button>

          <button
            onClick={() => handleSwitchSplit('hypertrophy_upper', 'Upper Hypertrophy Split')}
            className="py-2 px-3 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] font-extrabold border border-[var(--border-color)] transition-all flex items-center justify-center gap-1.5"
          >
            <Activity className="w-4 h-4 text-cyan-400" /> Switch Upper Split
          </button>
        </div>
      </div>

    </div>
  );
}
