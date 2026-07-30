import React, { useState, useRef } from 'react';
import { Waves, Loader2 } from 'lucide-react';
import api from '../../services/api';

const LEVEL_STYLE = {
  Low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40',
  Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/40',
  High: 'text-rose-400 bg-rose-500/10 border-rose-500/40'
};

// Sensor units chosen to match datasets/processed/stress_train.csv exactly:
// skin humidity as a raw sensor % (10–30 typical), skin temperature in the
// dataset's native (Fahrenheit-ish) units — no re-scaling here so the model
// sees exactly the distribution it was trained on.
export function StressCheckCard() {
  const [humidity, setHumidity] = useState(18);
  const [temperature, setTemperature] = useState(85);
  const [steps, setSteps] = useState(4200);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  // React batches setLoading, so a second click fired in the same tick (rapid
  // double-click, or a synthetic double-submit) would still see loading===false
  // and slip through — this ref is checked synchronously to actually block it.
  const submittingRef = useRef(false);

  async function submit(e) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    try {
      const { data } = await api.post('/ml/stress-level', {
        skin_humidity: Number(humidity),
        skin_temperature: Number(temperature),
        steps: Number(steps)
      });
      setResult(data);
    } catch (err) {
      setResult({ error: err?.response?.data?.message || 'Request failed' });
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-cyan-400" />
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Skin-Sensor Stress Classifier</h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-bold font-mono">
          XGBoost · F1 1.00
        </span>
      </div>

      <p className="text-[11px] text-[var(--text-tertiary)]">
        Trained on a wearable skin-humidity + temperature + step dataset. Enter simulated readings to see the model classify stress in real time.
      </p>

      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] space-y-1">
          Skin humidity
          <input
            type="number" step="0.1" value={humidity}
            onChange={(e) => setHumidity(e.target.value)}
            className="w-full mt-1 p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono text-xs"
          />
        </label>
        <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] space-y-1">
          Skin temperature
          <input
            type="number" step="0.1" value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            className="w-full mt-1 p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono text-xs"
          />
        </label>
        <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] space-y-1">
          Steps
          <input
            type="number" step="1" value={steps}
            onChange={(e) => setSteps(e.target.value)}
            className="w-full mt-1 p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono text-xs"
          />
        </label>
        <button
          type="submit" disabled={loading}
          className="sm:col-span-3 mt-1 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider border border-cyan-500/40 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Classifying…</> : 'Classify Stress'}
        </button>
      </form>

      {result && !result.error && (
        <div className={`p-3 rounded-xl border ${LEVEL_STYLE[result.stress_level] || 'text-[var(--text-primary)] bg-[var(--bg-tertiary)] border-[var(--border-color)]'} space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider">Predicted</span>
            <span className="font-extrabold text-lg">{result.stress_level}</span>
          </div>
          <div className="text-[10px] font-mono opacity-80">Confidence: {(result.confidence * 100).toFixed(1)}%</div>
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            {Object.entries(result.probabilities || {}).map(([label, prob]) => (
              <div key={label} className="p-1 rounded bg-black/20 text-center">
                <div className="font-bold">{label}</div>
                <div className="font-mono opacity-70">{(prob * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result?.error && (
        <p className="text-[11px] text-rose-400">Error: {result.error}</p>
      )}
    </div>
  );
}
