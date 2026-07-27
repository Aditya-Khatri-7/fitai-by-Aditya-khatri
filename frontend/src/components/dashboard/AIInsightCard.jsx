import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { calculateRecoveryScore } from '../../utils/recoveryCalculator';

export function AIInsightCard({ user, metrics }) {
  const recovery = calculateRecoveryScore(metrics, user);
  const activeInjury = user?.injuries?.find(i => i.isActive);
  const injuryClause = activeInjury
    ? `while keeping ${activeInjury.bodyPart || 'the affected area'} strain zero`
    : 'across your full range of movement';
  const level = recovery.score >= 75 ? 'optimal' : recovery.score >= 45 ? 'moderate' : 'low — prioritizing recovery';

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-3 relative overflow-hidden">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center text-[var(--accent-primary)]">
          <Sparkles className="w-4 h-4" />
        </div>
        <h3 className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider">DAILY AI INSIGHT</h3>
      </div>

      <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
        {recovery.isUncalibrated ? (
          <span>"Biometric sensors are currently uncalibrated. Sync your smartwatch or log biometric telemetry to enable personalized AI adaptive recovery scoring {injuryClause}."</span>
        ) : (
          <span>"Your recovery score is {level} at <strong className="text-[var(--accent-primary)]">{recovery.score}%</strong>. Based on today's sleep and soreness data, today's workout has been customized to target your current split {injuryClause}."</span>
        )}
      </p>

      <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
        <span className="text-[var(--text-tertiary)] text-[11px]">Adaptation Engine v4.2</span>
        <button className="text-[var(--accent-primary)] font-semibold hover:underline flex items-center gap-1">
          Explore Reasoning <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
