import React, { useState } from 'react';
import { Sliders, Building, Home, Sun, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export function WorkoutSimulator() {
  const [duration, setDuration] = useState(45);
  const [location, setLocation] = useState('gym');

  const handleSimulate = () => {
    toast.success(`AI Regenerated Workout for ${duration} mins at ${location.toUpperCase()}!`);
  };

  return (
    <div className="p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
        <Sliders className="w-4 h-4 text-[var(--accent-primary)]" /> REALTIME WORKOUT ENVIRONMENT SIMULATOR
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Duration Slider */}
        <div className="space-y-2">
          <div className="flex justify-between font-bold text-[var(--text-primary)]">
            <span>Available Time Target</span>
            <span className="text-[var(--accent-primary)] font-mono">{duration} Mins</span>
          </div>
          <input
            type="range"
            min="15"
            max="90"
            step="15"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full accent-[var(--accent-primary)] cursor-pointer"
          />
        </div>

        {/* Location selector */}
        <div className="space-y-2">
          <span className="font-bold text-[var(--text-primary)] block">Training Location</span>
          <div className="flex gap-2">
            <button
              onClick={() => setLocation('gym')}
              className={`flex-1 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                location === 'gym'
                  ? 'bg-[var(--accent-primary)] text-slate-950 border-[var(--accent-primary)] shadow-md'
                  : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Building className="w-4 h-4" /> Gym
            </button>
            <button
              onClick={() => setLocation('home')}
              className={`flex-1 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                location === 'home'
                  ? 'bg-[var(--accent-primary)] text-slate-950 border-[var(--accent-primary)] shadow-md'
                  : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Home className="w-4 h-4" /> Home
            </button>
            <button
              onClick={() => setLocation('outdoor')}
              className={`flex-1 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                location === 'outdoor'
                  ? 'bg-[var(--accent-primary)] text-slate-950 border-[var(--accent-primary)] shadow-md'
                  : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sun className="w-4 h-4" /> Outdoor
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={handleSimulate}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 transform hover:scale-[1.01]"
      >
        <Sparkles className="w-4 h-4" /> Regenerate Workout for New Parameters
      </button>
    </div>
  );
}
