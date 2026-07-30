import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { generateYogaWorkout } from '../../redux/slices/workoutSlice';
import { X, Flower2, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = [
  {
    key: 'level',
    title: 'What\'s your yoga experience?',
    options: [
      { value: 'beginner', label: 'Beginner', desc: 'New to yoga or returning after a break' },
      { value: 'intermediate', label: 'Intermediate', desc: 'Comfortable with most standing poses' },
      { value: 'advanced', label: 'Advanced', desc: 'Regular practice, deep backbends and binds' }
    ]
  },
  {
    key: 'goal',
    title: 'What\'s your main goal today?',
    options: [
      { value: 'flexibility', label: 'Flexibility', desc: 'Deep stretching and mobility' },
      { value: 'strength', label: 'Strength', desc: 'Standing poses and holds' },
      { value: 'stress_relief', label: 'Stress Relief', desc: 'Calming, restorative flow' },
      { value: 'balance', label: 'Balance', desc: 'Single-leg and stability poses' },
      { value: 'recovery', label: 'Recovery', desc: 'Gentle, low-intensity session' }
    ]
  },
  {
    key: 'focusArea',
    title: 'Any specific focus area?',
    options: [
      { value: 'full_body', label: 'Full Body', desc: 'Balanced sequence across the whole body' },
      { value: 'hips', label: 'Hips & Legs', desc: 'Hip openers and leg stretches' },
      { value: 'back', label: 'Back & Spine', desc: 'Spinal mobility and backbends' },
      { value: 'core', label: 'Core', desc: 'Core-engaging holds' },
      { value: 'stress_relief', label: 'Stress Relief', desc: 'Restful, grounding poses' }
    ]
  },
  {
    key: 'duration',
    title: 'How long do you want to practice?',
    options: [
      { value: 15, label: '15 min', desc: 'Quick session' },
      { value: 30, label: '30 min', desc: 'Standard flow' },
      { value: 45, label: '45 min', desc: 'Extended session' },
      { value: 60, label: '60 min', desc: 'Full practice' }
    ]
  }
];

export function YogaQuestionnaireModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({ level: 'beginner', goal: 'flexibility', focusArea: 'full_body', duration: 30 });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const handleSelect = (value) => {
    setAnswers(prev => ({ ...prev, [step.key]: value }));
  };

  const handleNext = async () => {
    if (!isLastStep) {
      setStepIndex(i => i + 1);
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(generateYogaWorkout(answers)).unwrap();
      toast.success('Your yoga flow is ready 🧘');
      onClose();
      setStepIndex(0);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to build yoga session');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Flower2 className="w-5 h-5 text-[var(--accent-primary)]" />
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Yoga Setup ({stepIndex + 1}/{STEPS.length})
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)]">
            <X className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <h3 className="text-lg font-extrabold text-[var(--text-primary)]">{step.title}</h3>
          <div className="space-y-2">
            {step.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                  answers[step.key] === opt.value
                    ? 'bg-[var(--accent-glow)] border-[var(--accent-primary)]'
                    : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/50'
                }`}
              >
                <div className="text-sm font-bold text-[var(--text-primary)]">{opt.label}</div>
                <div className="text-[11px] text-[var(--text-secondary)]">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-5 border-t border-[var(--border-color)]">
          <button
            onClick={() => setStepIndex(i => Math.max(0, i - 1))}
            disabled={stepIndex === 0}
            className="px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={handleNext}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-slate-950 text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-60"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Building...</>
            ) : isLastStep ? (
              <>Build My Flow <Flower2 className="w-4 h-4" /></>
            ) : (
              <>Next <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
