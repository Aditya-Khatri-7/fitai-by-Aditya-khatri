import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { CheatCenter } from '../components/cheat/CheatCenter';
import { PartyPopper } from 'lucide-react';

export function CheatPage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shadow-lg shrink-0">
              <PartyPopper className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Cheat Center</h2>
              <p className="text-xs text-[var(--text-secondary)]">Earn it, then spend it — XP-gated cheat meals & cheat days.</p>
            </div>
          </div>
        </div>

        <CheatCenter />
      </div>
    </DashboardLayout>
  );
}
