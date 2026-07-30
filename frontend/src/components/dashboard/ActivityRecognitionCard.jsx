import React, { useEffect, useState, useRef } from 'react';
import { Activity, Loader2, Check, X } from 'lucide-react';
import api from '../../services/api';

export function ActivityRecognitionCard() {
  const [samples, setSamples] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [featureCount, setFeatureCount] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSamples, setLoadingSamples] = useState(true);
  // Same rationale as StressCheckCard: setLoading is batched, so a rapid
  // double-click could see loading===false twice and fire duplicate requests
  // without this synchronous guard.
  const submittingRef = useRef(false);

  useEffect(() => {
    api.get('/ml/activity/samples')
      .then(({ data }) => {
        setSamples(data.samples || []);
        setFeatureCount(data.feature_count || 0);
      })
      .catch(() => setSamples([]))
      .finally(() => setLoadingSamples(false));
  }, []);

  async function classify() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/ml/activity/classify-sample', { sample_index: selectedIdx });
      setResult(data);
    } catch (err) {
      setResult({ error: err?.response?.data?.message || 'Request failed' });
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  const currentSample = samples[selectedIdx];

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-fuchsia-400" />
          <h3 className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider">Accelerometer Activity Classifier</h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-300 text-[10px] font-bold font-mono">
          XGBoost · F1 0.94
        </span>
      </div>

      <p className="text-[11px] text-[var(--text-tertiary)]">
        Trained on UCI-HAR ({featureCount || 561} engineered accelerometer features).
        The browser can't produce that stream, so pick a real labeled test recording and watch the model classify it live.
      </p>

      {loadingSamples ? (
        <p className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Loading samples…</p>
      ) : samples.length === 0 ? (
        <p className="text-[11px] text-rose-400">No demo samples available — regenerate ml/models/har_demo_samples.json.</p>
      ) : (
        <>
          <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] block space-y-1">
            Test recording
            <select
              value={selectedIdx}
              onChange={(e) => { setSelectedIdx(Number(e.target.value)); setResult(null); }}
              className="w-full mt-1 p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono text-xs"
            >
              {samples.map((s) => (
                <option key={s.index} value={s.index}>#{s.index + 1} — {s.true_label}</option>
              ))}
            </select>
          </label>

          {currentSample && (
            <p className="text-[11px] text-[var(--text-secondary)] italic px-1">
              {currentSample.description}
            </p>
          )}

          <button
            onClick={classify} disabled={loading}
            className="w-full py-2 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 text-xs font-bold uppercase tracking-wider border border-fuchsia-500/40 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Classifying…</> : 'Classify Sample'}
          </button>
        </>
      )}

      {result && !result.error && (
        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Predicted</span>
            <span className="font-extrabold text-lg text-[var(--text-primary)]">{result.activity}</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--text-tertiary)]">True label: <span className="font-mono text-[var(--text-secondary)]">{result.true_label}</span></span>
            <span className={`flex items-center gap-1 font-bold ${result.correct ? 'text-emerald-400' : 'text-rose-400'}`}>
              {result.correct ? <><Check className="w-3 h-3" /> correct</> : <><X className="w-3 h-3" /> misclassified</>}
            </span>
          </div>
          <div className="text-[10px] font-mono text-[var(--text-tertiary)]">Confidence: {(result.confidence * 100).toFixed(1)}%</div>
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            {Object.entries(result.probabilities || {})
              .sort(([, a], [, b]) => b - a)
              .map(([label, prob]) => (
                <div key={label} className={`p-1 rounded text-center ${label === result.activity ? 'bg-fuchsia-500/20 text-fuchsia-200' : 'bg-black/20 text-[var(--text-tertiary)]'}`}>
                  <div className="font-bold truncate">{label}</div>
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
