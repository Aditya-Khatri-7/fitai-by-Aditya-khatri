import React, { useEffect, useState } from 'react';
import { Cpu } from 'lucide-react';
import api from '../../services/api';

export function MLInsightsCard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ml/metrics')
      .then(({ data }) => setMetrics(data))
      .catch(() => setMetrics(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[var(--accent-primary)]" />
          <h3 className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider">ACTIVE PYTHON ML INFERENCE ENGINE</h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] text-[10px] font-bold font-mono">
          FastAPI Port 8001
        </span>
      </div>

      {!loading && !metrics && (
        <p className="text-[11px] text-[var(--text-tertiary)]">ML service offline or not yet trained — run ml/run_pipeline.py.</p>
      )}

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
          <span className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase">Recovery Regressor</span>
          <p className="font-extrabold text-[var(--text-primary)] font-mono">XGBoost</p>
          <span className="text-[var(--accent-primary)] text-[10px] font-semibold block">
            {metrics ? `MAE: ${metrics.recovery.mae.toFixed(2)} | R²: ${metrics.recovery.r2.toFixed(2)}` : '--'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
          <span className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase">Injury Classifier</span>
          <p className="font-extrabold text-[var(--text-primary)] font-mono">XGBoost Multi-Class</p>
          <span className="text-purple-400 text-[10px] font-semibold block">
            {metrics ? `Weighted F1: ${metrics.injury.f1.toFixed(2)}` : '--'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
          <span className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase">Recommender</span>
          <p className="font-extrabold text-[var(--text-primary)] font-mono">{metrics ? metrics.recommender.encoder : 'MiniLM-L6'}</p>
          <span className="text-[var(--accent-primary)] text-[10px] font-semibold block">
            {metrics ? `${metrics.recommender.embedding_dim}-Dim · ${metrics.recommender.count} exercises` : '--'}
          </span>
        </div>
      </div>
    </div>
  );
}
