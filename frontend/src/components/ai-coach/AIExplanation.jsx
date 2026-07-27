import React from 'react';
import { useSelector } from 'react-redux';
import { Sparkles, Brain, ShieldCheck } from 'lucide-react';

export function AIExplanation() {
  const { todayWorkout } = useSelector(state => state.workout);

  return (
    <div className="p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-3 text-[var(--text-primary)] transition-colors">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-[var(--accent-primary)]" />
        <h3 className="text-xs font-extrabold text-[var(--accent-primary)] uppercase tracking-wider">AI ADAPTIVE DECISION EXPLANATION</h3>
      </div>

      <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
        {todayWorkout?.aiExplanation || 'The AI synthesizes real-time wearable telemetry (sleep quality, HRV, resting HR), reported physical injuries, chronic medical constraints, and available equipment to reconstruct your exact training volume every 24 hours.'}
      </p>

      <div className="grid grid-cols-3 gap-2 text-[11px] pt-2">
        <div className="p-2.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <span className="text-[var(--text-tertiary)] font-bold block">Biometric Inputs</span>
          <span className="text-[var(--accent-primary)] font-bold">5 Telemetry Signals</span>
        </div>
        <div className="p-2.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <span className="text-[var(--text-tertiary)] font-bold block">Injury Constraints</span>
          <span className="text-[var(--warning)] font-bold">Knee Strain Active</span>
        </div>
        <div className="p-2.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <span className="text-[var(--text-tertiary)] font-bold block">Safety Compliance</span>
          <span className="text-[var(--success)] font-bold">100% Verified</span>
        </div>
      </div>
    </div>
  );
}
