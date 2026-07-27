import React from 'react';
import { useSelector } from 'react-redux';
import { HeartPulse } from 'lucide-react';

export function ChronicConditions() {
  const { user } = useSelector(state => state.auth);
  const conditions = user?.healthProfile?.chronicConditions || [];

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
        <HeartPulse className="w-4 h-4 text-[var(--accent-primary)]" /> CHRONIC DISEASE HEALTH MANAGEMENT
      </h3>

      <div className="space-y-3 text-xs">
        {conditions.length === 0 ? (
          <p className="text-[var(--text-tertiary)] italic">No chronic medical conditions reported.</p>
        ) : (
          conditions.map((cond, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[var(--accent-primary)] text-sm uppercase">{cond.condition}</span>
                <span className="px-2 py-0.5 rounded bg-[var(--accent-glow)] text-[var(--accent-primary)] font-bold text-[10px] uppercase">
                  {cond.severity} Severity
                </span>
              </div>
              <p className="text-[var(--text-primary)]">
                <strong className="text-[var(--text-secondary)]">Medications: </strong>
                {cond.medications?.join(', ') || 'None'}
              </p>
              <p className="text-[var(--text-secondary)]">
                <strong className="text-[var(--text-primary)]">Safety Protocol: </strong>
                {cond.restrictions?.join(', ') || 'Monitor intensity caps.'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
