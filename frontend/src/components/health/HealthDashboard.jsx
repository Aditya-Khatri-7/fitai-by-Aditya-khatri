import React from 'react';
import { useSelector } from 'react-redux';
import { InjuryManager } from './InjuryManager';
import { ChronicConditions } from './ChronicConditions';
import { RecoveryTimeline } from './RecoveryTimeline';
import { SleepAnalysis } from './SleepAnalysis';
import { RecoveryScoreRing } from '../dashboard/RecoveryScoreRing';
import { BiometricSignals } from '../dashboard/BiometricSignals';
import { ScreeningInsights } from './ScreeningInsights';
import { YogaPoseChecker } from './YogaPoseChecker';
import { MindfulnessSuggestion } from './MindfulnessSuggestion';

export function HealthDashboard() {
  const { user } = useSelector(state => state.auth);
  const { todayMetrics } = useSelector(state => state.health);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl">
        <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Health Intelligence & Wearable Hub</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Real-time biometric processing, chronic condition rules, and recovery memory timeline</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecoveryScoreRing metrics={todayMetrics} user={user} />
        <BiometricSignals metrics={todayMetrics} />
        <SleepAnalysis metrics={todayMetrics} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InjuryManager />
        <ChronicConditions />
      </div>

      <ScreeningInsights />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <YogaPoseChecker />
        <MindfulnessSuggestion />
      </div>

      <RecoveryTimeline />
    </div>
  );
}
