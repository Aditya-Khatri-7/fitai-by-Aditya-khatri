import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { BrainCircuit, Loader2 } from 'lucide-react';
import api from '../../services/api';

// Real content-based recommender over meditation.csv (68 real techniques,
// SentenceTransformer embeddings) — see ml/training/train_meditation_recommender.py.
// Query is built from the user's current self-reported stress + recovery signal
// rather than requiring any new input.
export function MindfulnessSuggestion() {
  const { todayMetrics } = useSelector(state => state.health);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const stress = todayMetrics?.stress;
  const elevated = typeof stress === 'number' && stress >= 50;

  const load = async () => {
    setLoading(true);
    try {
      const mood = elevated ? 'stressed and tense' : 'calm, looking to maintain focus';
      const { data } = await api.post('/ml/recommend-meditation', { mood, focus: 'stress relief and recovery', top_k: 3 });
      setSuggestions(data.recommendations || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-3">
      <div className="flex items-center gap-2">
        <BrainCircuit className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Mindfulness Suggestion</h3>
      </div>

      {!suggestions && (
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[11px] font-bold text-[var(--text-secondary)] flex items-center gap-2 disabled:opacity-50"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {elevated ? 'Stress looks elevated — get a suggestion' : 'Get a technique suggestion'}
        </button>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <div key={i} className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <p className="text-xs font-bold text-[var(--text-primary)]">{s.title}</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{s.description}</p>
              <p className="text-[9px] text-[var(--text-tertiary)] mt-1">Duration: {s.duration}</p>
            </div>
          ))}
        </div>
      )}
      {suggestions && suggestions.length === 0 && (
        <p className="text-[10px] text-[var(--text-tertiary)] italic">No suggestions available right now.</p>
      )}
    </div>
  );
}
