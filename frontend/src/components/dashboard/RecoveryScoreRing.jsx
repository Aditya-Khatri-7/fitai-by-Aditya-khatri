import React from 'react';
import { calculateRecoveryScore } from '../../utils/recoveryCalculator';
import { Activity } from 'lucide-react';

export function RecoveryScoreRing({ metrics, user }) {
  const recovery = calculateRecoveryScore(metrics, user);
  const strokeDashoffset = 283 - (283 * recovery.score) / 100;

  return (
    <div className="relative p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl flex flex-col items-center justify-between text-center overflow-hidden">
      <div className="w-full flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
        <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-[var(--accent-primary)]" /> RECOVERY SCORE
        </span>
        <span className="px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[10px] text-[var(--accent-primary)] font-mono">Realtime</span>
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
    </div>
  );
}
