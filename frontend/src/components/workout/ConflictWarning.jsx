import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export function ConflictWarning({ conflicts }) {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="space-y-2">
      {conflicts.map((conf, i) => (
        <div
          key={i}
          className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
            conf.severity === 'high'
              ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
          }`}
        >
          {conf.severity === 'high' ? (
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold uppercase tracking-wider text-[10px] block">
              {conf.type.replace('_', ' ')}
            </span>
            <span className="font-medium">{conf.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
