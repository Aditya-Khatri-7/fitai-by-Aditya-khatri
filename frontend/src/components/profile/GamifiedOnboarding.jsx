import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateProfile } from '../../redux/slices/authSlice';
import { addXp, setArchetype } from '../../redux/slices/gamificationSlice';
import { useTheme } from '../../context/ThemeContext';
import { EquipmentSelector } from './EquipmentSelector';
import { GoalSetting } from './GoalSetting';
import { ConditionAutocomplete } from './ConditionAutocomplete';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { parseHealthTextAI } from '../../utils/aiMedicalExtractor';
import {
  ArrowRight,
  ArrowLeft,
  Watch,
  Sparkles,
  Mic,
  CheckCircle2,
  Trophy,
  Palette,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const ARCHETYPES = [
  {
    id: 'juggernaut',
    name: 'Strength Juggernaut',
    tagline: 'Heavy Overload & Raw Power',
    desc: 'Specialized in progressive weightlifting, compound movements, and maximal strength development.',
    color: '#3B82F6',
    icon: 'Dumbbell',
    bonusStats: { strength: 15, endurance: 5, mobility: 0, consistency: 10, recovery: 5 }
  },
  {
    id: 'sentinel',
    name: 'Endurance Sentinel',
    tagline: 'High Stamina & Aerobic Resilience',
    desc: 'Designed for marathon runners, rowers, and high-volume stamina athletes.',
    color: '#10B981',
    icon: 'Activity',
    bonusStats: { strength: 5, endurance: 15, mobility: 5, consistency: 10, recovery: 5 }
  },
  {
    id: 'monk',
    name: 'Mobility Monk',
    tagline: 'Joint Health & Calisthenics Mastery',
    desc: 'Focused on posture correction, flexibility, injury rehabilitation, and bodyweight control.',
    color: '#8B5CF6',
    icon: 'Sparkles',
    bonusStats: { strength: 5, endurance: 5, mobility: 15, consistency: 5, recovery: 10 }
  },
  {
    id: 'titan',
    name: 'Hybrid Titan',
    tagline: 'Balanced Tactical Athleticism',
    desc: 'The ultimate versatile hybrid athlete combining muscle mass, stamina, and agility.',
    color: '#F59E0B',
    icon: 'Flame',
    bonusStats: { strength: 10, endurance: 10, mobility: 5, consistency: 10, recovery: 5 }
  }
];

export function GamifiedOnboarding() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { setIsThemeSwitcherOpen } = useTheme();
  const [step, setStep] = useState(1);

  // Form State
  const [selectedArchetype, setSelectedArchetype] = useState(ARCHETYPES[0]);
  const [age, setAge] = useState(27);
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState(178);
  const [weight, setWeight] = useState(79);
  const [goal, setGoal] = useState('muscle_gain');
  const [equipment, setEquipment] = useState(['barbell', 'dumbbell', 'cable']);
  const [isSyncing, setIsSyncing] = useState(false);

  // Step 2 AI Medical Intake State
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [healthText, setHealthText] = useState('');
  const [painLevel, setPainLevel] = useState(0);
  const [selectedBodyParts, setSelectedBodyParts] = useState([]);
  const [extractedData, setExtractedData] = useState(null);

  // Voice Input Hook
  const { isListening, toggleListening } = useVoiceInput((transcript) => {
    setHealthText(prev => (prev ? `${prev} ${transcript}` : transcript));
    triggerAIExtraction(healthText + " " + transcript, selectedConditions, painLevel, selectedBodyParts);
  });

  const triggerAIExtraction = (text = healthText, conds = selectedConditions, pain = painLevel, parts = selectedBodyParts) => {
    const result = parseHealthTextAI(text, conds, pain, parts);
    setExtractedData(result);
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
    else {
      dispatch(updateProfile({
        profile: { age, gender, height, weight, fitnessLevel: 'intermediate' },
        equipment,
        currentGoal: { type: goal, targetValue: 84, unit: 'kg' },
        healthProfile: {
          chronicConditions: extractedData?.conditions || selectedConditions,
          aiRiskLevel: extractedData?.aiRiskLevel || 'Low'
        },
        onboardingCompleted: true
      }));

      dispatch(setArchetype(selectedArchetype));
      dispatch(addXp(500));

      toast.success('RPG Hero Character Created! +500 XP Welcome Bonus Awarded! 🎉');
      navigate('/dashboard');
    }
  };

  const handleSimulateSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      dispatch(addXp(100));
      toast.success('Wearable Sensor Linked! +100 XP Telemetry Bonus Granted! ⌚');
      handleNext();
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-6 text-[var(--text-primary)] relative overflow-hidden transition-all">
      
      {/* Top Header & Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs font-bold flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--border-color)]">
            RPG CHARACTER CREATION WIZARD
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsThemeSwitcherOpen(true)}
              className="px-3 py-1 rounded-full bg-[var(--bg-tertiary)] hover:bg-[var(--accent-glow)] text-[var(--text-primary)] hover:text-[var(--accent-primary)] border border-[var(--border-color)] flex items-center gap-1.5 transition-all text-xs font-extrabold"
              title="Change Theme Studio"
            >
              <Palette className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>Theme Studio 🎨</span>
            </button>
            <span className="text-[var(--accent-primary)] font-mono">STEP {step} OF 5 ({step * 20}%)</span>
          </div>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden border border-[var(--border-color)]">
          <div
            className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 transition-all duration-500 shadow-md"
            style={{ width: `${step * 20}%` }}
          />
        </div>
      </div>

      {/* STEP 1: HERO ARCHETYPE SELECTION */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
              Choose Your Fitness Hero Class
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Your archetype determines your starting attribute bonuses, AI adaptive split focus, and RPG perk path.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ARCHETYPES.map((arch) => {
              const isSelected = selectedArchetype.id === arch.id;
              return (
                <div
                  key={arch.id}
                  onClick={() => setSelectedArchetype(arch)}
                  className={`p-6 rounded-3xl border-2 cursor-pointer transition-all space-y-3 relative overflow-hidden ${
                    isSelected
                      ? 'bg-[var(--accent-glow)] border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/50 scale-[1.02] shadow-2xl'
                      : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-900/60 text-white border border-slate-700">
                      {arch.tagline}
                    </span>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)] text-slate-950 flex items-center justify-center shadow-lg">
                        <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-extrabold text-[var(--text-primary)]">{arch.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">{arch.desc}</p>

                  <div className="pt-2 border-t border-[var(--border-color)] flex flex-wrap gap-1.5 text-[10px] font-bold">
                    {Object.entries(arch.bonusStats).map(([stat, val]) => (
                      val > 0 && (
                        <span key={stat} className="px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--accent-primary)] border border-[var(--border-color)]">
                          +{val} {stat.toUpperCase()}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: TELEMETRY & MEDICAL AI INTAKE */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-[var(--text-primary)]">Step 2: Base Telemetry & AI Medical Intake</h3>
            <p className="text-xs text-[var(--text-secondary)]">Input physical stats and describe injuries or medical notes via text or voice microphone.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <label className="text-[var(--text-secondary)] font-bold block mb-1">Age</label>
              <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold" />
            </div>
            <div className="p-3 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <label className="text-[var(--text-secondary)] font-bold block mb-1">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full p-2.5 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="p-3 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <label className="text-[var(--text-secondary)] font-bold block mb-1">Height (cm)</label>
              <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold" />
            </div>
            <div className="p-3 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <label className="text-[var(--text-secondary)] font-bold block mb-1">Weight (kg)</label>
              <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Medical Intake / Doctor Notes / Injuries:</label>
              <button
                type="button"
                onClick={toggleListening}
                className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--border-color)]'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{isListening ? 'Listening...' : 'Voice Intake 🎤'}</span>
              </button>
            </div>
            <textarea
              rows="3"
              value={healthText}
              onChange={(e) => {
                setHealthText(e.target.value);
                triggerAIExtraction(e.target.value, selectedConditions, painLevel, selectedBodyParts);
              }}
              placeholder="e.g. ACL surgery 8 months ago. Mild lower back strain..."
              className="w-full p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] font-medium focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <ConditionAutocomplete
            selectedConditions={selectedConditions}
            onSelectCondition={(cond) => {
              const next = [...selectedConditions, cond];
              setSelectedConditions(next);
              triggerAIExtraction(healthText, next, painLevel, selectedBodyParts);
            }}
            onRemoveCondition={(condToRemove) => {
              const next = selectedConditions.filter(c => (c.id ? c.id !== condToRemove.id : c !== condToRemove));
              setSelectedConditions(next);
              triggerAIExtraction(healthText, next, painLevel, selectedBodyParts);
            }}
          />
        </div>
      )}

      {/* STEP 3: FITNESS GOALS */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h3 className="text-xl font-extrabold text-[var(--text-primary)]">Step 3: Primary Target & Equipment Loadout</h3>
          <GoalSetting currentGoal={goal} onChange={setGoal} />
          <div className="pt-4">
            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Available Equipment</h4>
            <EquipmentSelector selected={equipment} onChange={setEquipment} />
          </div>
        </div>
      )}

      {/* STEP 4: WEARABLE TELEMETRY SYNC */}
      {step === 4 && (
        <div className="space-y-6 text-center py-8 animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] border-2 border-[var(--accent-primary)] mx-auto flex items-center justify-center shadow-2xl animate-pulse">
            <Watch className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold text-[var(--text-primary)]">Step 4: Smartwatch & Telemetry Link</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
              Link your Apple Watch, Garmin, or Oura ring to automatically feed heart rate variability, sleep recovery, and strain metrics into FitAI.
            </p>
          </div>
          <button
            onClick={handleSimulateSync}
            disabled={isSyncing}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 text-slate-950 font-extrabold text-xs shadow-2xl flex items-center gap-2 mx-auto hover:opacity-90 transition-all transform hover:scale-105"
          >
            {isSyncing ? 'Synchronizing Sensor Telemetry...' : 'Link Sensor Telemetry (+100 XP Bonus)'}
          </button>
        </div>
      )}

      {/* STEP 5: 3D COACH RITUAL & WELCOME LOOT */}
      {step === 5 && (
        <div className="space-y-6 text-center py-6 animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[var(--accent-primary)] to-amber-400 text-slate-950 mx-auto flex items-center justify-center shadow-2xl animate-bounce">
            <Trophy className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              INITIATION RITUAL READY
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
              Welcome to FitAI, {selectedArchetype.name}!
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
              Your RPG Hero Character Card has been generated. You have unlocked your starter badge and earned your first 500 XP!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] max-w-md mx-auto flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--accent-primary)] flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> STARTER LOOT PACK
            </span>
            <span className="font-extrabold font-mono text-emerald-400">+500 WELCOME XP</span>
          </div>

          <button
            onClick={handleNext}
            className="w-full max-w-md py-4 rounded-2xl bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 text-slate-950 font-extrabold text-sm shadow-2xl hover:opacity-90 flex items-center justify-center gap-2 mx-auto transition-all transform hover:scale-105"
          >
            <span>ENTER FITAI DASHBOARD</span>
            <ArrowRight className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex justify-between pt-4 border-t border-[var(--border-color)]">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs font-semibold disabled:opacity-40 border border-[var(--border-color)] flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {step < 5 && (
          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 font-extrabold text-xs shadow-lg flex items-center gap-2"
          >
            <span>Next Step</span> <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  );
}
