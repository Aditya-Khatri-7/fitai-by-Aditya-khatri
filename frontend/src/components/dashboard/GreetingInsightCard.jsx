import React, { useState } from 'react';
import { Sparkles, ChevronRight, AlertTriangle } from 'lucide-react';
import { calculateRecoveryScore } from '../../utils/recoveryCalculator';

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

const FACTOR_LABELS = {
  sleepQuality: 'Sleep Quality',
  inverseSoreness: 'Low Soreness',
  inverseStress: 'Low Stress',
  hrDeltaScore: 'HR Stability',
  hydrationScore: 'Hydration'
};

const ML_LEVEL_TO_SENTENCE = {
  Optimal: 'optimal',
  Moderate: 'moderate',
  'Critical Rest': 'low — prioritizing recovery'
};

// Merges the old standalone welcome banner with the Daily AI Insight card —
// same recovery-driven copy as the original AIInsightCard, just surfaced
// immediately below the quick-action buttons instead of further down.
export function GreetingInsightCard({ user, metrics, mlPrediction }) {
  const [expanded, setExpanded] = useState(false);
  // The granular per-factor breakdown only exists in the local heuristic (the
  // real XGBoost model doesn't return per-request feature contributions — its
  // "top_contributors" field is a fixed constant, not computed from this
  // request, so it isn't used here to avoid presenting it as real reasoning).
  const localRecovery = calculateRecoveryScore(metrics, user);
  // Prefer the live ML score/level for the headline when available, matching
  // RecoveryScoreRing — otherwise the greeting and the recovery ring could
  // show two different numbers for the same "today".
  const displayScore = mlPrediction ? mlPrediction.recovery_score : localRecovery.score;
  const displayLevel = mlPrediction
    ? (ML_LEVEL_TO_SENTENCE[mlPrediction.recovery_level] || 'moderate')
    : (localRecovery.score >= 75 ? 'optimal' : localRecovery.score >= 45 ? 'moderate' : 'low — prioritizing recovery');

  const activeInjury = user?.injuries?.find(i => i.isActive);
  const injuryClause = activeInjury
    ? `while keeping ${activeInjury.bodyPart || 'the affected area'} strain zero`
    : 'across your full range of movement';
  const firstName = user?.name?.split(' ')[0] || 'there';

  const factorEntries = Object.entries(localRecovery.breakdown || {})
    .map(([key, value]) => ({ key, label: FACTOR_LABELS[key] || key, value, weight: localRecovery.weights?.[key] || 0 }))
    .sort((a, b) => b.weight - a.weight);

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-3 relative overflow-hidden">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center text-[var(--accent-primary)]">
          <Sparkles className="w-4 h-4" />
        </div>
        <h3 className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider">DAILY AI INSIGHT</h3>
      </div>

      <h2 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)]">
        {timeOfDayGreeting()}, {firstName} 👋
      </h2>

      <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
        {localRecovery.isUncalibrated && !mlPrediction ? (
          <span>"Biometric sensors are currently uncalibrated. Sync your smartwatch or log biometric telemetry to enable personalized AI adaptive recovery scoring {injuryClause}."</span>
        ) : (
          <span>"Your recovery score is {displayLevel} at <strong className="text-[var(--accent-primary)]">{displayScore}%</strong>. Based on today's sleep and soreness data, today's workout has been customized to target your current split {injuryClause}."</span>
        )}
      </p>

      <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
        <span className="text-[var(--text-tertiary)] text-[11px]">Adaptation Engine v4.2</span>
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-[var(--accent-primary)] font-semibold hover:underline flex items-center gap-1"
        >
          {expanded ? 'Hide Reasoning' : 'Explore Reasoning'}
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {expanded && (
        <div className="pt-3 border-t border-[var(--border-color)] space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
              Signal Breakdown (weighted, from today's real metrics)
            </p>
            <div className="space-y-1.5">
              {factorEntries.map(f => (
                <div key={f.key} className="flex items-center gap-2 text-[11px]">
                  <span className="w-24 shrink-0 text-[var(--text-secondary)]">{f.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent-primary)] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, f.value))}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right font-mono text-[var(--text-tertiary)]">
                    {Math.round(f.value)}/100 · {Math.round(f.weight * 100)}% wt
                  </span>
                </div>
              ))}
            </div>
          </div>

          {mlPrediction && (
            <div className="p-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                XGBoost Model Cross-Check
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Trained recovery regressor rates today <strong className="text-[var(--text-primary)]">{mlPrediction.recovery_level}</strong> ({mlPrediction.recovery_score}%).
              </p>
              {Array.isArray(mlPrediction.limiting_factors) && mlPrediction.limiting_factors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {mlPrediction.limiting_factors.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] border border-amber-500/30">
                      <AlertTriangle className="w-2.5 h-2.5" /> {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
