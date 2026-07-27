import React from 'react';
import { Moon } from 'lucide-react';

export function SleepAnalysis({ metrics }) {
  if (!metrics?.sleep) return null;
  const sleep = metrics.sleep;

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
          <Moon className="w-4 h-4 text-[var(--accent-primary)]" /> SLEEP STAGE ARCHITECTURE
        </h3>
        <span className="text-xs font-extrabold text-[var(--accent-primary)] font-mono">{sleep.duration} Hours Total</span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase">Deep Sleep</span>
          <p className="font-extrabold text-[var(--accent-primary)] font-mono mt-0.5">{sleep.deepSleep || 2.1}h</p>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase">REM Sleep</span>
          <p className="font-extrabold text-[var(--text-primary)] font-mono mt-0.5">{sleep.remSleep || 1.8}h</p>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase">Light Sleep</span>
          <p className="font-extrabold text-[var(--text-secondary)] font-mono mt-0.5">{sleep.lightSleep || 3.9}h</p>
        </div>
      </div>
    </div>
  );
}
