import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { HeartPulse, Loader2, ShieldQuestion } from 'lucide-react';
import api from '../../services/api';

const RISK_COLOR = { low: '#10B981', elevated: '#F43F5E' };

// Real XGBoost screening models (bodyfat.csv, Pima Indians diabetes.csv,
// heart.csv) trained on the exact feature set the app can realistically supply
// — see ml/training/preprocess.py. Two optional circumference fields and three
// optional screening checkboxes fill in the handful of clinically-predictive
// inputs the app doesn't already collect; everything else defaults server-side.
export function ScreeningInsights() {
  const { user } = useSelector(state => state.auth);
  const { todayMetrics } = useSelector(state => state.health);

  const [neckCm, setNeckCm] = useState('');
  const [abdomenCm, setAbdomenCm] = useState('');
  const [familyHistory, setFamilyHistory] = useState(false);
  const [cholesterol, setCholesterol] = useState('');
  const [chestPain, setChestPain] = useState(false);
  const [exerciseAngina, setExerciseAngina] = useState(false);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const runScreening = async () => {
    setLoading(true);
    const age = user?.profile?.age || 30;
    const gender = user?.profile?.gender === 'female' ? 'female' : 'male';
    const weight_kg = user?.profile?.weight || 70;
    const height_cm = user?.profile?.height || 170;

    try {
      const [bodyfat, diabetes, cardio] = await Promise.all([
        api.post('/ml/bodyfat', {
          age, gender, weight_kg, height_cm,
          neck_cm: neckCm ? Number(neckCm) : undefined,
          abdomen_cm: abdomenCm ? Number(abdomenCm) : undefined
        }).then(r => r.data).catch(() => null),
        api.post('/ml/diabetes-risk', {
          age, gender, weight_kg, height_cm,
          glucose: todayMetrics?.bloodSugar || undefined,
          blood_pressure: todayMetrics?.bloodPressure?.diastolic || undefined,
          family_history_diabetes: familyHistory
        }).then(r => r.data).catch(() => null),
        api.post('/ml/cardio-risk', {
          age, gender,
          resting_bp: todayMetrics?.bloodPressure?.systolic || undefined,
          max_hr: todayMetrics?.heartRate?.max || undefined,
          cholesterol: cholesterol ? Number(cholesterol) : undefined,
          chest_pain_symptomatic: chestPain,
          exercise_angina: exerciseAngina
        }).then(r => r.data).catch(() => null)
      ]);
      setResults({ bodyfat, diabetes, cardio });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <div className="flex items-center gap-2">
        <HeartPulse className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Health Risk Screening (ML)</h3>
      </div>

      <p className="text-[10px] text-[var(--text-tertiary)] flex items-start gap-1.5">
        <ShieldQuestion className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Wellness screening only, not a medical diagnosis — consult a healthcare provider. Body-fat model trained on an all-male dataset; diabetes model trained on an all-female cohort (Pima Indians) — treat results outside those groups with extra caution.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
        <label className="flex flex-col gap-1">
          <span className="text-[var(--text-tertiary)]">Neck (cm, optional)</span>
          <input type="number" value={neckCm} onChange={e => setNeckCm(e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)]" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[var(--text-tertiary)]">Waist/Abdomen (cm, optional)</span>
          <input type="number" value={abdomenCm} onChange={e => setAbdomenCm(e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)]" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[var(--text-tertiary)]">Cholesterol (mg/dL, optional)</span>
          <input type="number" value={cholesterol} onChange={e => setCholesterol(e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)]" />
        </label>
        <label className="flex items-center gap-2 text-[var(--text-secondary)]">
          <input type="checkbox" checked={familyHistory} onChange={e => setFamilyHistory(e.target.checked)} /> Family history of diabetes
        </label>
        <label className="flex items-center gap-2 text-[var(--text-secondary)]">
          <input type="checkbox" checked={chestPain} onChange={e => setChestPain(e.target.checked)} /> Chest pain on exertion
        </label>
        <label className="flex items-center gap-2 text-[var(--text-secondary)]">
          <input type="checkbox" checked={exerciseAngina} onChange={e => setExerciseAngina(e.target.checked)} /> Exercise-induced angina
        </label>
      </div>

      <button
        onClick={runScreening}
        disabled={loading}
        className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Run Screening
      </button>

      {results && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[var(--border-color)]">
          <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Body Fat</span>
            {results.bodyfat ? (
              <>
                <p className="text-lg font-extrabold text-[var(--text-primary)]">{results.bodyfat.bodyfat_pct}%</p>
                <p className="text-[10px] text-[var(--text-secondary)]">{results.bodyfat.category}</p>
              </>
            ) : <p className="text-[10px] text-[var(--text-tertiary)]">Unavailable</p>}
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Diabetes Risk</span>
            {results.diabetes ? (
              <>
                <p className="text-lg font-extrabold uppercase" style={{ color: RISK_COLOR[results.diabetes.risk_level] }}>{results.diabetes.risk_level}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Probability: {Math.round(results.diabetes.probability * 100)}%</p>
                {results.diabetes.caveat_note && <p className="text-[9px] text-[var(--text-tertiary)] mt-1">{results.diabetes.caveat_note}</p>}
              </>
            ) : <p className="text-[10px] text-[var(--text-tertiary)]">Unavailable</p>}
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Cardio Risk</span>
            {results.cardio ? (
              <>
                <p className="text-lg font-extrabold uppercase" style={{ color: RISK_COLOR[results.cardio.risk_level] }}>{results.cardio.risk_level}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Probability: {Math.round(results.cardio.probability * 100)}%</p>
              </>
            ) : <p className="text-[10px] text-[var(--text-tertiary)]">Unavailable</p>}
          </div>
        </div>
      )}
    </div>
  );
}
