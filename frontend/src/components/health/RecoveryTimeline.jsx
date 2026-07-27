import React from 'react';
import { useSelector } from 'react-redux';
import { Sparkles } from 'lucide-react';

export function RecoveryTimeline() {
  const { aiMemories } = useSelector(state => state.health);

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" /> AI MEMORY & RECOVERY EVENT TIMELINE
      </h3>

      <div className="relative border-l border-[var(--border-color)] ml-3 space-y-6 text-xs">
        {aiMemories.map((event, idx) => (
          <div key={idx} className="relative pl-6 space-y-1">
            <div className="absolute -left-2 top-0.5 w-4 h-4 rounded-full bg-[var(--bg-tertiary)] border-2 border-[var(--accent-primary)] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[var(--text-primary)]">{event.title}</span>
              <span className="text-[10px] text-[var(--text-tertiary)] font-mono">{event.timestamp}</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">{event.details}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
