import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setWearableModalOpen } from '../../redux/slices/uiSlice';
import { syncWearable } from '../../redux/slices/healthSlice';
import {
  Watch,
  Smartphone,
  Edit3,
  CheckCircle2,
  RefreshCw,
  X,
  Sparkles,
  Heart,
  Moon,
  Zap,
  Activity,
  Droplet,
  Footprints,
  Sliders,
  Check,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

export function WearableSync() {
  const dispatch = useDispatch();
  const { isWearableModalOpen } = useSelector(state => state.ui);

  const [phase, setPhase] = useState('select'); // 'select' | 'syncing' | 'manual'
  const [device, setDevice] = useState('watch'); // 'watch' | 'band' | 'manual'
  const [syncStepIndex, setSyncStepIndex] = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isUpdatingRecovery, setIsUpdatingRecovery] = useState(false);

  // Form State for 8 metrics
  const [metrics, setMetrics] = useState({
    sleepDuration: 7.5,
    sleepQuality: 82,
    restingHR: 64,
    stressLevel: 38,
    soreness: 4,
    hydration: 7,
    steps: 9200,
    sysBP: 122,
    diaBP: 80
  });

  if (!isWearableModalOpen) return null;

  const syncSteps = [
    { label: "Establishing connection...", progress: 20 },
    { label: "Reading heart rate data...", progress: 45 },
    { label: "Syncing sleep cycles...", progress: 68 },
    { label: "Processing biometric signals...", progress: 90 },
    { label: "Calibrating recovery engine...", progress: 100 }
  ];

  const handleStartSync = () => {
    if (device === 'manual') {
      setPhase('manual');
      return;
    }

    setPhase('syncing');
    setSyncStepIndex(0);
    setSyncProgress(20);

    const stepIntervals = [800, 1600, 2400, 3200];

    stepIntervals.forEach((time, index) => {
      setTimeout(() => {
        setSyncStepIndex(index + 1);
        setSyncProgress(syncSteps[index + 1].progress);
      }, time);
    });

    setTimeout(() => {
      // Auto-fill realistic metrics post sync
      setMetrics({
        sleepDuration: Number((7.0 + Math.random() * 1.5).toFixed(1)),
        sleepQuality: Math.floor(78 + Math.random() * 18),
        restingHR: Math.floor(58 + Math.random() * 10),
        stressLevel: Math.floor(25 + Math.random() * 25),
        soreness: Math.floor(2 + Math.random() * 4),
        hydration: Math.floor(7 + Math.random() * 2),
        steps: Math.floor(8500 + Math.random() * 3500),
        sysBP: Math.floor(118 + Math.random() * 10),
        diaBP: Math.floor(76 + Math.random() * 8)
      });
      setPhase('manual');
    }, 4200);
  };

  const handleAutoFillAll = () => {
    setMetrics({
      sleepDuration: 8.0,
      sleepQuality: 88,
      restingHR: 61,
      stressLevel: 32,
      soreness: 3,
      hydration: 8,
      steps: 10400,
      sysBP: 120,
      diaBP: 78
    });
    toast.success("AI simulated optimal biometric dataset!");
  };

  const handleAutoFillMetric = (key, val) => {
    setMetrics(prev => ({ ...prev, [key]: val }));
    toast.success(`Updated metric with AI optimal value`);
  };

  const handleSaveMetrics = async () => {
    setIsUpdatingRecovery(true);
    const newSyncObj = {
      source: device === 'manual' ? 'manual' : 'wearable_sync',
      heartRate: { resting: metrics.restingHR, active: 142, max: 175 },
      sleep: { duration: metrics.sleepDuration, quality: metrics.sleepQuality },
      steps: metrics.steps,
      caloriesBurned: Math.floor(2200 + metrics.steps * 0.04),
      hydration: metrics.hydration,
      stress: metrics.stressLevel,
      soreness: { level: metrics.soreness, bodyParts: ['legs'] },
      bloodPressure: { systolic: metrics.sysBP, diastolic: metrics.diaBP }
    };

    const result = await dispatch(syncWearable(newSyncObj));
    setIsUpdatingRecovery(false);
    if (syncWearable.fulfilled.match(result)) {
      dispatch(setWearableModalOpen(false));
      toast.success('Biometric metrics saved & Recovery Score updated!');
    } else {
      toast.error(result.payload || 'Sync failed — please try again.');
    }
  };

  // Metric status color helper
  const getStatusColor = (metricKey, val) => {
    if (metricKey === 'sleepDuration') {
      if (val >= 7 && val <= 9) return 'text-[var(--success)]';
      if (val >= 6) return 'text-[var(--warning)]';
      return 'text-[var(--danger)]';
    }
    if (metricKey === 'sleepQuality') {
      if (val >= 75) return 'text-[var(--success)]';
      if (val >= 60) return 'text-[var(--warning)]';
      return 'text-[var(--danger)]';
    }
    if (metricKey === 'restingHR') {
      if (val >= 55 && val <= 75) return 'text-[var(--success)]';
      if (val <= 85) return 'text-[var(--warning)]';
      return 'text-[var(--danger)]';
    }
    if (metricKey === 'stressLevel') {
      if (val <= 40) return 'text-[var(--success)]';
      if (val <= 65) return 'text-[var(--warning)]';
      return 'text-[var(--danger)]';
    }
    if (metricKey === 'soreness') {
      if (val <= 3) return 'text-[var(--success)]';
      if (val <= 6) return 'text-[var(--warning)]';
      return 'text-[var(--danger)]';
    }
    if (metricKey === 'hydration') {
      if (val >= 8) return 'text-[var(--success)]';
      if (val >= 5) return 'text-[var(--warning)]';
      return 'text-[var(--danger)]';
    }
    if (metricKey === 'steps') {
      if (val >= 10000) return 'text-[var(--success)]';
      if (val >= 6000) return 'text-[var(--warning)]';
      return 'text-[var(--danger)]';
    }
    return 'text-[var(--accent-primary)]';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-[680px] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative text-[var(--text-primary)] max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => dispatch(setWearableModalOpen(false))}
          className="absolute top-6 right-6 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[var(--accent-glow)] text-[var(--accent-primary)] flex items-center justify-center">
            <Watch className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold tracking-tight">Wearable Biometric Sync</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {phase === 'select' && 'Select your device to initiate live Bluetooth/API synchronization'}
              {phase === 'syncing' && 'Establishing encrypted sensor data stream'}
              {phase === 'manual' && 'Review and fine-tune detected biometric metrics'}
            </p>
          </div>
        </div>

        {/* PHASE 1: DEVICE SELECTION */}
        {phase === 'select' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Smart Watch */}
              <button
                onClick={() => setDevice('watch')}
                className={`p-5 rounded-2xl border text-left flex flex-col justify-between h-[150px] transition-all relative ${
                  device === 'watch'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)] ring-2 ring-[var(--accent-primary)]/30'
                    : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-[var(--accent-primary)]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Watch className="w-10 h-10 text-[var(--accent-primary)]" />
                  {device === 'watch' && (
                    <span className="w-6 h-6 rounded-full bg-[var(--accent-primary)] text-slate-950 flex items-center justify-center">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">Smart Watch</h4>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-2">
                    HRV, Continuous Heart Rate, Sleep Stages, Active Calories
                  </p>
                </div>
              </button>

              {/* Fitness Band */}
              <button
                onClick={() => setDevice('band')}
                className={`p-5 rounded-2xl border text-left flex flex-col justify-between h-[150px] transition-all relative ${
                  device === 'band'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)] ring-2 ring-[var(--accent-primary)]/30'
                    : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-[var(--accent-primary)]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Smartphone className="w-10 h-10 text-[var(--accent-primary)]" />
                  {device === 'band' && (
                    <span className="w-6 h-6 rounded-full bg-[var(--accent-primary)] text-slate-950 flex items-center justify-center">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">Fitness Band</h4>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-2">
                    Step Cadence, Resting HR, Sleep Duration, Daily Activity
                  </p>
                </div>
              </button>

              {/* Manual Entry */}
              <button
                onClick={() => setDevice('manual')}
                className={`p-5 rounded-2xl border text-left flex flex-col justify-between h-[150px] transition-all relative ${
                  device === 'manual'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)] ring-2 ring-[var(--accent-primary)]/30'
                    : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-[var(--accent-primary)]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Edit3 className="w-10 h-10 text-[var(--accent-primary)]" />
                  {device === 'manual' && (
                    <span className="w-6 h-6 rounded-full bg-[var(--accent-primary)] text-slate-950 flex items-center justify-center">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">Manual Entry</h4>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-2">
                    Self-reported biometric metrics & subjective logs
                  </p>
                </div>
              </button>
            </div>

            <button
              onClick={handleStartSync}
              className="w-full py-3.5 rounded-2xl bg-[var(--accent-primary)] text-slate-950 font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              {device === 'manual' ? 'Proceed to Manual Entry' : 'Start Device Sync Simulation'}
            </button>
          </div>
        )}

        {/* PHASE 2: SYNC ANIMATION */}
        {phase === 'syncing' && (
          <div className="p-8 rounded-3xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-6 text-center">
            {/* Animated Signal Waves */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[var(--accent-primary)] animate-ping opacity-40"></div>
              <div className="absolute inset-2 rounded-full border border-[var(--accent-primary)]/60 animate-pulse"></div>
              <div className="w-16 h-16 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] flex items-center justify-center relative z-10 shadow-lg">
                <Watch className="w-8 h-8 animate-bounce" />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--accent-primary)]">
                <span>Synchronizing Device Signals</span>
                <span>{syncProgress}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-[var(--bg-primary)] overflow-hidden p-0.5 border border-[var(--border-color)]">
                <div
                  className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-500"
                  style={{ width: `${syncProgress}%` }}
                ></div>
              </div>
            </div>

            {/* 5 Step Progress List */}
            <div className="space-y-2 text-left max-w-md mx-auto pt-2">
              {syncSteps.map((step, i) => {
                const isDone = i < syncStepIndex || syncProgress === 100;
                const isCurrent = i === syncStepIndex && syncProgress < 100;

                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-2.5 rounded-xl text-xs transition-all ${
                      isDone
                        ? 'text-[var(--success)] font-semibold bg-[var(--success)]/10'
                        : isCurrent
                        ? 'text-[var(--accent-primary)] font-bold bg-[var(--accent-glow)] border border-[var(--accent-primary)]/30'
                        : 'text-[var(--text-tertiary)] opacity-60'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-[var(--success)] shrink-0" />
                    ) : isCurrent ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent-primary)] shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0"></div>
                    )}
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </div>

            {syncProgress === 100 && (
              <div className="p-3 rounded-xl bg-[var(--success)]/20 text-[var(--success)] font-bold text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Sync Complete — 7 metrics updated
              </div>
            )}
          </div>
        )}

        {/* PHASE 3: MANUAL ENTRY / RICH FORM */}
        {phase === 'manual' && (
          <div className="space-y-6">
            {/* Top Bar with AI Auto-Fill All */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
                <Sliders className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>Adjust Biometrics</span>
              </div>
              <button
                onClick={handleAutoFillAll}
                className="px-3 py-1.5 rounded-xl bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 hover:border-[var(--accent-primary)] font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Auto-Fill All
              </button>
            </div>

            {/* 8 Metric Cards (2-column Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Card 1: Sleep Duration */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <Moon className="w-4 h-4 text-purple-400" />
                    <span>Sleep Duration</span>
                  </div>
                  <span className={`font-extrabold text-sm ${getStatusColor('sleepDuration', metrics.sleepDuration)}`}>
                    {metrics.sleepDuration}h
                  </span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="12.0"
                  step="0.5"
                  value={metrics.sleepDuration}
                  onChange={(e) => setMetrics({ ...metrics, sleepDuration: parseFloat(e.target.value) })}
                  className="w-full accent-[var(--accent-primary)] cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                  <span>Optimal: 7-9 hours</span>
                  <button
                    onClick={() => handleAutoFillMetric('sleepDuration', 7.5)}
                    className="text-[var(--accent-primary)] font-bold hover:underline"
                  >
                    AI Fill (7.5h)
                  </button>
                </div>
              </div>

              {/* Card 2: Sleep Quality */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Sleep Quality</span>
                  </div>
                  <span className={`font-extrabold text-sm ${getStatusColor('sleepQuality', metrics.sleepQuality)}`}>
                    {metrics.sleepQuality}%
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  step="1"
                  value={metrics.sleepQuality}
                  onChange={(e) => setMetrics({ ...metrics, sleepQuality: parseInt(e.target.value) })}
                  className="w-full accent-[var(--accent-primary)] cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                  <span>Target: &gt;70%</span>
                  <button
                    onClick={() => handleAutoFillMetric('sleepQuality', 85)}
                    className="text-[var(--accent-primary)] font-bold hover:underline"
                  >
                    AI Fill (85%)
                  </button>
                </div>
              </div>

              {/* Card 3: Resting Heart Rate */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span>Resting Heart Rate</span>
                  </div>
                  <span className={`font-extrabold text-sm ${getStatusColor('restingHR', metrics.restingHR)}`}>
                    {metrics.restingHR} bpm
                  </span>
                </div>
                <input
                  type="range"
                  min="45"
                  max="110"
                  step="1"
                  value={metrics.restingHR}
                  onChange={(e) => setMetrics({ ...metrics, restingHR: parseInt(e.target.value) })}
                  className="w-full accent-[var(--accent-primary)] cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                  <span>Normal: 60-80 bpm</span>
                  <button
                    onClick={() => handleAutoFillMetric('restingHR', 62)}
                    className="text-[var(--accent-primary)] font-bold hover:underline"
                  >
                    AI Fill (62)
                  </button>
                </div>
              </div>

              {/* Card 4: Stress Level */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>Stress Level</span>
                  </div>
                  <span className={`font-extrabold text-sm ${getStatusColor('stressLevel', metrics.stressLevel)}`}>
                    {metrics.stressLevel}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  value={metrics.stressLevel}
                  onChange={(e) => setMetrics({ ...metrics, stressLevel: parseInt(e.target.value) })}
                  className="w-full accent-[var(--accent-primary)] cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                  <span>Target: &lt;50%</span>
                  <button
                    onClick={() => handleAutoFillMetric('stressLevel', 35)}
                    className="text-[var(--accent-primary)] font-bold hover:underline"
                  >
                    AI Fill (35%)
                  </button>
                </div>
              </div>

              {/* Card 5: Muscle Soreness */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Muscle Soreness</span>
                  </div>
                  <span className={`font-extrabold text-sm ${getStatusColor('soreness', metrics.soreness)}`}>
                    {metrics.soreness} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={metrics.soreness}
                  onChange={(e) => setMetrics({ ...metrics, soreness: parseInt(e.target.value) })}
                  className="w-full accent-[var(--accent-primary)] cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                  <span>1 (Rested) - 10 (Severe)</span>
                  <button
                    onClick={() => handleAutoFillMetric('soreness', 3)}
                    className="text-[var(--accent-primary)] font-bold hover:underline"
                  >
                    AI Fill (3)
                  </button>
                </div>
              </div>

              {/* Card 6: Hydration Intake */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <Droplet className="w-4 h-4 text-blue-400" />
                    <span>Hydration Intake</span>
                  </div>
                  <span className={`font-extrabold text-sm ${getStatusColor('hydration', metrics.hydration)}`}>
                    {metrics.hydration} / 8 glasses
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="16"
                  step="1"
                  value={metrics.hydration}
                  onChange={(e) => setMetrics({ ...metrics, hydration: parseInt(e.target.value) })}
                  className="w-full accent-[var(--accent-primary)] cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                  <span>Target: 8+ glasses today</span>
                  <button
                    onClick={() => handleAutoFillMetric('hydration', 8)}
                    className="text-[var(--accent-primary)] font-bold hover:underline"
                  >
                    AI Fill (8)
                  </button>
                </div>
              </div>

              {/* Card 7: Steps Today */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <Footprints className="w-4 h-4 text-teal-400" />
                    <span>Steps Today</span>
                  </div>
                  <span className={`font-extrabold text-sm ${getStatusColor('steps', metrics.steps)}`}>
                    {metrics.steps.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="25000"
                  step="500"
                  value={metrics.steps}
                  onChange={(e) => setMetrics({ ...metrics, steps: parseInt(e.target.value) })}
                  className="w-full accent-[var(--accent-primary)] cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                  <span>Target: 10,000 steps</span>
                  <button
                    onClick={() => handleAutoFillMetric('steps', 10000)}
                    className="text-[var(--accent-primary)] font-bold hover:underline"
                  >
                    AI Fill (10k)
                  </button>
                </div>
              </div>

              {/* Card 8: Blood Pressure */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <Activity className="w-4 h-4 text-red-400" />
                    <span>Blood Pressure</span>
                  </div>
                  <span className="font-extrabold text-sm text-[var(--accent-primary)]">
                    {metrics.sysBP} / {metrics.diaBP} mmHg
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-[var(--text-tertiary)] block mb-1">SYS: {metrics.sysBP}</span>
                    <input
                      type="range"
                      min="90"
                      max="180"
                      step="1"
                      value={metrics.sysBP}
                      onChange={(e) => setMetrics({ ...metrics, sysBP: parseInt(e.target.value) })}
                      className="w-full accent-[var(--accent-primary)] cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-tertiary)] block mb-1">DIA: {metrics.diaBP}</span>
                    <input
                      type="range"
                      min="60"
                      max="120"
                      step="1"
                      value={metrics.diaBP}
                      onChange={(e) => setMetrics({ ...metrics, diaBP: parseInt(e.target.value) })}
                      className="w-full accent-[var(--accent-primary)] cursor-pointer"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                  <span>Optimal: 120/80 mmHg</span>
                  <button
                    onClick={() => setMetrics(prev => ({ ...prev, sysBP: 120, diaBP: 80 }))}
                    className="text-[var(--accent-primary)] font-bold hover:underline"
                  >
                    AI Fill (120/80)
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            {isUpdatingRecovery ? (
              <div className="p-4 rounded-2xl bg-[var(--accent-glow)] border border-[var(--accent-primary)]/40 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-[var(--accent-primary)]">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Calibrating ML Recovery Score & Rebalancing Workouts...</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--border-color)]">
                <button
                  onClick={() => setPhase('select')}
                  className="px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleSaveMetrics}
                  className="flex-1 py-3 rounded-xl bg-[var(--accent-primary)] text-slate-950 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save Metrics & Update Recovery Score
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
