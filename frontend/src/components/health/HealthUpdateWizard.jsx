import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addAIMemory, extractHealthIntake, confirmHealthIntake } from '../../redux/slices/healthSlice';
import { useTheme } from '../../context/ThemeContext';
import { Stethoscope, CheckCircle2, ArrowRight, Sparkles, Upload, Mic, MicOff, AlertTriangle, ShieldCheck, Activity, Search } from 'lucide-react';
import { ConditionAutocomplete } from '../profile/ConditionAutocomplete';
import { BodyPainMap } from './BodyPainMap';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { parseHealthTextAI } from '../../utils/aiMedicalExtractor';
import { getSocket } from '../../services/socket';
import toast from 'react-hot-toast';

export function HealthUpdateWizard({ onComplete, embedded = false }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { mobileMode, isNarrowViewport } = useTheme();
  const isCompact = mobileMode || isNarrowViewport;
  const [step, setStep] = useState(1);

  // AI Intake State
  const [updateType, setUpdateType] = useState('injury'); // surgery | injury | chronic_condition | recovery | medication
  const [healthText, setHealthText] = useState('');
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [selectedBodyParts, setSelectedBodyParts] = useState([]);
  const [painLevel, setPainLevel] = useState(0);
  const [laterality, setLaterality] = useState('bilateral');
  const [followUpAnswers, setFollowUpAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiExtraction, setAiExtraction] = useState(null);

  // Voice recording hook
  const { isListening, transcript, startListening, stopListening, isSupported } = useVoiceInput();

  // Update text when voice transcript is generated
  useEffect(() => {
    if (transcript) {
      setHealthText(prev => (prev ? `${prev} ${transcript}` : transcript));
    }
  }, [transcript]);

  // Local rule-based extraction drives the live UI instantly (no network wait).
  const localResult = parseHealthTextAI(healthText, selectedConditions, painLevel, selectedBodyParts);

  // When the backend's Gemini-backed extraction returns a confident read, prefer it —
  // same local-first/escalate-to-AI pattern used by the workout coach and meal timing engine.
  const aiResult = (aiExtraction && !aiExtraction.needsManualReview && aiExtraction.conditions?.length > 0)
    ? {
        conditions: aiExtraction.conditions.map(c => ({
          name: c.condition,
          bodyPart: c.bodyPart,
          side: c.side,
          severity: c.severity,
          painLevel: c.painLevel,
          recoveryStage: c.recoveryStage,
          doctorRestrictions: c.doctorRestrictions || [],
          avoidExercises: c.avoidExercises || [],
          recommendedExercises: c.recommendExercises || []
        })),
        followUpQuestions: aiExtraction.followUpQuestions || [],
        aiRiskLevel: localResult.aiRiskLevel
      }
    : localResult;

  const handleNext = () => {
    if (step === 1 && healthText.trim().length > 5) {
      dispatch(extractHealthIntake({ text: healthText, priorAnswers: followUpAnswers }))
        .then((r) => {
          if (extractHealthIntake.fulfilled.match(r)) setAiExtraction(r.payload);
        });
    }
    if (step < 4) setStep(step + 1);
  };

  const handleApplyHealthUpdate = async () => {
    setIsSubmitting(true);

    const mainCondition = aiResult.conditions[0]?.name || selectedConditions[0] || 'Medical Update';
    const restrictionsList = aiResult.conditions[0]?.doctorRestrictions || [];
    const restrictions = restrictionsList.join(', ') || 'Controlled movement required';

    const result = await dispatch(confirmHealthIntake({
      updateType,
      conditions: aiResult.conditions.map(c => ({
        condition: c.name,
        bodyPart: c.bodyPart || selectedBodyParts[0] || 'unspecified',
        severity: c.severity || (painLevel >= 7 ? 'severe' : painLevel >= 4 ? 'moderate' : 'mild'),
        doctorRestrictions: c.doctorRestrictions || []
      }))
    }));

    setIsSubmitting(false);

    if (confirmHealthIntake.fulfilled.match(result)) {
      getSocket().emit('health:updated');
      dispatch(addAIMemory({
        id: `mem_${Date.now()}`,
        timestamp: new Date().toISOString().split('T')[0],
        eventType: 'chronic_condition_update',
        title: `AI CLINICAL UPDATE: ${mainCondition}`,
        details: `User reported ${updateType} (${laterality} ${selectedBodyParts.join(', ') || 'joint'}). Restrictions: ${restrictions}.`
      }));
      toast.success('Health profile updated — your active conditions and restrictions now reflect this.');
      if (onComplete) onComplete();
      else navigate('/dashboard');
    } else {
      toast.error(result.payload || 'Failed to apply health update');
    }
  };

  return (
    <div className={embedded ? 'space-y-6' : 'max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-6'}>
      {/* Top Wizard Header */}
      <div className={`flex ${isCompact ? 'flex-col gap-3' : 'items-center justify-between'} border-b border-[var(--border-color)] pb-5`}>
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shadow-lg shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className={`font-extrabold text-[var(--text-primary)] ${isCompact ? 'text-base' : 'text-xl'}`}>AI Clinical Intake & Health Update Wizard</h2>
            {!isCompact && <p className="text-xs text-[var(--text-secondary)]">Natural language AI parsing, 150+ medical conditions, anatomical pain mapping & adaptive safety logic</p>}
          </div>
        </div>
        <span className="px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-400 font-extrabold text-xs font-mono border border-rose-500/30 self-start shrink-0">
          Step {step} / 4
        </span>
      </div>

      {/* STEP 1: EVENT CATEGORY & AI NATURAL LANGUAGE / VOICE INTAKE */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              1. Select Primary Health Category
            </h3>
            <div className={`grid grid-cols-2 gap-2.5 text-xs ${isCompact ? '' : 'sm:grid-cols-5'}`}>
              {[
                { id: 'surgery', label: '🏥 Surgery', desc: 'Post-op rehabilitation' },
                { id: 'injury', label: '🤕 Injury / Strain', desc: 'Joint/muscle strain' },
                { id: 'chronic_condition', label: '💊 Chronic Diagnosis', desc: 'BP, Diabetes, PCOS' },
                { id: 'recovery', label: '✅ Recovered', desc: 'Doctor cleared' },
                { id: 'medication', label: '🩺 Medication', desc: 'Prescription change' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setUpdateType(cat.id)}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between space-y-1 transition-all ${
                    updateType === cat.id
                      ? 'bg-rose-950/60 border-rose-500 text-rose-300 ring-1 ring-rose-500 shadow-lg'
                      : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]'
                  }`}
                >
                  <span className="font-extrabold text-xs text-[var(--text-primary)]">{cat.label}</span>
                  <span className="text-[10px] text-[var(--text-tertiary)] leading-tight">{cat.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Free-Text & Voice Dictation Input Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                Describe Your Health, Injury, Surgery or Restrictions In Your Own Words
              </label>
              {isSupported && (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--border-color)] hover:bg-[var(--accent-primary)] hover:text-slate-950'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {isListening ? 'Listening...' : 'Voice Dictate'}
                </button>
              )}
            </div>

            <textarea
              rows="3"
              value={healthText}
              onChange={(e) => setHealthText(e.target.value)}
              placeholder="e.g., 'I had rotator cuff surgery 6 months ago on my right shoulder. Doctor told me to avoid heavy overhead pressing and limit lifting to 10kg max.'"
              className="w-full p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] font-medium focus:outline-none focus:border-[var(--accent-primary)] leading-relaxed shadow-inner"
            />
          </div>

          {/* Searchable Medical Condition Database (150+ Conditions) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
              Search Medical Condition Catalog (150+ Diseases, Surgeries & Injuries)
            </label>
            <ConditionAutocomplete
              selectedConditions={selectedConditions}
              onChange={setSelectedConditions}
            />
          </div>
        </div>
      )}

      {/* STEP 2: ANATOMICAL PAIN MAP, LATERALITY & PAIN INTENSITY SLIDER */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in duration-300 text-xs">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            2. Anatomical Pain Mapping & Intensity Severity
          </h3>

          <div className={`grid grid-cols-1 gap-6 items-start ${isCompact ? '' : 'md:grid-cols-2'}`}>
            {/* Interactive Anatomical Pain Map */}
            <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase block mb-3 text-center">
                Click Affected Body Region
              </span>
              <BodyPainMap
                selectedParts={selectedBodyParts}
                onSelectPart={(part) => {
                  setSelectedBodyParts(prev =>
                    prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]
                  );
                }}
              />
            </div>

            {/* Laterality & Pain Slider */}
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="font-bold text-[var(--text-secondary)] block">Side / Laterality</label>
                <div className="grid grid-cols-3 gap-2">
                  {['left', 'right', 'bilateral'].map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setLaterality(side)}
                      className={`py-2.5 rounded-xl border text-xs font-bold capitalize transition-all ${
                        laterality === side
                          ? 'bg-[var(--accent-primary)] text-slate-950 border-[var(--accent-primary)] shadow-md'
                          : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {side}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-[var(--text-secondary)]">Pain / Discomfort Severity</span>
                  <span className={`text-sm px-2.5 py-0.5 rounded-lg ${
                    painLevel > 6 ? 'bg-rose-500/20 text-rose-400' : painLevel > 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {painLevel} / 10 ({painLevel > 6 ? 'Severe' : painLevel > 3 ? 'Moderate' : 'Mild'})
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={painLevel}
                  onChange={(e) => setPainLevel(Number(e.target.value))}
                  className="w-full accent-[var(--accent-primary)] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] font-bold">
                  <span>0 (No Pain)</span>
                  <span>5 (Moderate)</span>
                  <span>10 (Unbearable)</span>
                </div>
              </div>

              {/* Dynamic AI Follow-up Questions */}
              {aiResult.followUpQuestions.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-3">
                  <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> AI Follow-Up Clarification:
                  </span>
                  {aiResult.followUpQuestions.map((q) => (
                    <div key={q.id} className="space-y-1.5">
                      <p className="font-semibold text-[var(--text-primary)] text-xs">{q.question}</p>
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setFollowUpAnswers(prev => ({ ...prev, [q.id]: opt }))}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                              followUpAnswers[q.id] === opt
                                ? 'bg-amber-500 text-slate-950 border-amber-500'
                                : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)]'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: LIVE AI CLINICAL INTERPRETATION PANEL */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in duration-300 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-primary)] animate-pulse" />
              Live AI Clinical Interpretation & Safety Analysis
            </h3>
            <span className={`px-3 py-1 rounded-full font-bold text-xs ${
              aiResult.aiRiskLevel === 'High' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              AI Risk Level: {aiResult.aiRiskLevel}
            </span>
          </div>

          <div className={`grid grid-cols-1 gap-4 ${isCompact ? '' : 'md:grid-cols-2'}`}>
            {/* Extracted Conditions & Restrictions */}
            <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3">
              <span className="font-extrabold text-[var(--accent-primary)] uppercase tracking-wider block text-[11px]">
                🩺 Detected Medical Conditions ({aiResult.conditions.length})
              </span>
              {aiResult.conditions.map((cond, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-1.5">
                  <div className="flex items-center justify-between font-extrabold text-sm text-[var(--text-primary)]">
                    <span>{cond.name}</span>
                    <span className="text-[10px] text-[var(--accent-primary)] uppercase">{cond.side} • {cond.severity}</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <p className="text-[var(--text-secondary)] font-semibold">
                      <strong>AI Guardrails:</strong> {cond.doctorRestrictions.join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Contraindicated & Recommended Exercises */}
            <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3">
              <span className="font-extrabold text-rose-400 uppercase tracking-wider block text-[11px]">
                ❌ Contraindicated Movements (Excluded):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {aiResult.conditions.flatMap(c => c.avoidExercises).map((ex, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono font-bold text-[11px]">
                    ❌ {ex}
                  </span>
                ))}
              </div>

              <span className="font-extrabold text-emerald-400 uppercase tracking-wider block text-[11px] pt-2">
                ✅ Prescribed Safe Substitutions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {aiResult.conditions.flatMap(c => c.recommendedExercises).map((ex, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-[11px]">
                    ✅ {ex}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: FINAL RE-CONFIGURATION EXECUTION */}
      {step === 4 && (
        <div className="space-y-4 text-center py-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-xl">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-[var(--text-primary)]">Ready to Execute AI Re-Configuration</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            Clicking below will execute the adaptive AI reasoning engine, log the clinical memory, and auto-regenerate your workout, nutrition, and 3D coach guidance.
          </p>

          <button
            onClick={handleApplyHealthUpdate}
            disabled={isSubmitting}
            className="px-8 py-4 rounded-2xl bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 font-extrabold text-xs shadow-xl flex items-center gap-2 mx-auto transition-all"
          >
            {isSubmitting ? 'Regenerating Full Application State...' : '🚀 Apply AI Health Status & Regenerate App State'}
          </button>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex justify-between pt-4 border-t border-[var(--border-color)] text-xs">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-semibold border border-[var(--border-color)] disabled:opacity-40"
        >
          Back
        </button>
        {step < 4 && (
          <button
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 font-bold shadow-lg flex items-center gap-1.5"
          >
            Next Step <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
