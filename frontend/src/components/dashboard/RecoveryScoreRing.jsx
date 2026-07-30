import React from 'react';
import { calculateRecoveryScore } from '../../utils/recoveryCalculator';
import { Activity } from 'lucide-react';

const LEVEL_STYLE = {
  Optimal: { status: 'Optimal', color: '#10B981', category: 'Prime State' },
  Moderate: { status: 'Moderate Fatigue', color: '#F59E0B', category: 'Light / Technique' },
  'Critical Rest': { status: 'Critical Recovery', color: '#F43F5E', category: 'Rest & Stretch' }
};

// mlPrediction: the live /api/ml/recovery response (real XGBoost regressor
// output), fetched by DashboardPage.jsx. When present it replaces the local
// rule-based estimate below — that estimate now only serves as the
// instant-loading placeholder and true offline fallback, not the source of
// truth, since the trained recovery model was previously never actually called
// from the UI despite being served.
const INJURY_RISK_COLOR = { low: '#10B981', medium: '#F59E0B', high: '#F43F5E' };

export function RecoveryScoreRing({ metrics, user, mlPrediction, injuryRisk }) {
  const recovery = mlPrediction
    ? {
        score: mlPrediction.recovery_score,
        ...(LEVEL_STYLE[mlPrediction.recovery_level] || LEVEL_STYLE.Moderate),
        isUncalibrated: false
      }
    : calculateRecoveryScore(metrics, user);
  const strokeDashoffset = 283 - (283 * (recovery.score || 0)) / 100;

  return (
    <div className="relative p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl flex flex-col items-center justify-between text-center overflow-hidden">
      <div className="w-full flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
        <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-[var(--accent-primary)]" /> RECOVERY SCORE
        </span>
        <span className="px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[10px] text-[var(--accent-primary)] font-mono">{mlPrediction ? 'ML Model' : 'Estimate'}</span>
      </div>

      {/* SVG Ring */}
      <div className="relative w-44 h-44 my-3 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            className="text-[var(--bg-tertiary)]"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={recovery.color}
            strokeWidth="8"
            strokeDasharray="283"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            {recovery.isUncalibrated ? '--' : `${recovery.score}%`}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider mt-1 text-center px-2" style={{ color: recovery.color }}>
            {recovery.status}
          </span>
        </div>
      </div>

      <div className="w-full pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
        <span className="text-[var(--text-secondary)]">Recommended Load:</span>
        <span className="font-bold text-[var(--text-primary)]">{recovery.category}</span>
      </div>

      {injuryRisk && (
        <div className="w-full pt-2 flex items-center justify-between text-xs">
          <span className="text-[var(--text-secondary)]">Injury Risk (ML Model):</span>
          <span
            className="font-bold uppercase text-[11px] px-2 py-0.5 rounded-full"
            style={{ color: INJURY_RISK_COLOR[injuryRisk.injury_risk] || '#94A3B8', backgroundColor: `${INJURY_RISK_COLOR[injuryRisk.injury_risk] || '#94A3B8'}1A` }}
          >
            {injuryRisk.injury_risk}
          </span>
        </div>
      )}
    </div>
  );
}
