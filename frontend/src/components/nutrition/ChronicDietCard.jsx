import React from 'react';
import { ShieldCheck, HeartPulse } from 'lucide-react';

export function ChronicDietCard({ adjustments = [] }) {
  if (!adjustments || adjustments.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl space-y-2">
        <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> CHRONIC DISEASE DIETARY COMPLIANCE
        </h4>
        <p className="text-xs text-[var(--text-secondary)]">No active chronic condition restrictions flagged. Standard hyper-trophy macro distribution active.</p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xl space-y-3">
      <h4 className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider flex items-center gap-2">
        <HeartPulse className="w-4 h-4 text-[var(--accent-primary)]" /> CHRONIC DISEASE NUTRITION PROTOCOL
      </h4>

      <div className="space-y-2 text-xs">
        {adjustments.map((adj, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
            <span className="font-bold text-[var(--accent-primary)] block">{adj.condition}</span>
            <p className="text-[var(--text-primary)] leading-relaxed">{adj.adjustment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
