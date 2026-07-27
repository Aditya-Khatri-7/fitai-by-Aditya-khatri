import React from 'react';
import { Moon, Flame, Zap, Heart, Droplets } from 'lucide-react';

export function BiometricSignals({ metrics }) {
  if (!metrics) {
    return (
      <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl h-full flex flex-col justify-center items-center text-center space-y-3">
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">BIOMETRIC SIGNALS</h3>
        <p className="text-xs text-[var(--text-secondary)]">No biometric telemetry synced yet.</p>
        <span className="text-[11px] font-semibold text-[var(--accent-primary)] px-3 py-1 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          Sync Wearable Device to Calibrate Signals
        </span>
      </div>
    );
  }

  const signals = [
    { label: 'Sleep Quality', value: `${metrics.sleep?.quality || 75}%`, pct: metrics.sleep?.quality || 75, icon: Moon, color: 'from-blue-500 to-indigo-500' },
    { label: 'Muscle Soreness', value: `${metrics.soreness?.level || 4}/10`, pct: ((10 - (metrics.soreness?.level || 4)) * 10), icon: Flame, color: 'from-rose-500 to-amber-500' },
    { label: 'Stress Index', value: `${metrics.stress || 32}/100`, pct: (100 - (metrics.stress || 32)), icon: Zap, color: 'from-amber-500 to-yellow-400' },
    { label: 'Resting Heart Rate', value: `${metrics.heartRate?.resting || 61} bpm`, pct: 85, icon: Heart, color: 'from-emerald-500 to-teal-400' },
    { label: 'Hydration Intake', value: `${metrics.hydration || 6}/8 glasses`, pct: Math.min(100, ((metrics.hydration || 6) / 8) * 100), icon: Droplets, color: 'from-cyan-500 to-blue-400' }
  ];

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">BIOMETRIC SIGNALS</h3>

      <div className="space-y-3.5">
        {signals.map((sig, idx) => {
          const Icon = sig.icon;
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[var(--text-primary)] flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  {sig.label}
                </span>
                <span className="text-[var(--text-primary)] font-mono">{sig.value}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${sig.color} transition-all duration-700`}
                  style={{ width: `${sig.pct}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
