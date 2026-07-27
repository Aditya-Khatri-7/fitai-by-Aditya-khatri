import React from 'react';
import { Sparkles, X, Check } from 'lucide-react';

const MUSCLE_PARTS = [
  { id: 'chest', label: 'Chest', keyWords: ['chest'] },
  { id: 'shoulders', label: 'Shoulders', keyWords: ['shoulders', 'delt'] },
  { id: 'back', label: 'Back & Lats', keyWords: ['back', 'lats'] },
  { id: 'biceps', label: 'Biceps & Triceps', keyWords: ['biceps', 'triceps', 'arms'] },
  { id: 'abs', label: 'Abs & Core', keyWords: ['abs', 'core'] },
  { id: 'quads', label: 'Quads & Legs', keyWords: ['quads', 'quadriceps', 'legs'] },
  { id: 'calves', label: 'Calves', keyWords: ['calves'] }
];

export function MuscleHeatmap({
  activeMuscles = ['chest', 'shoulders', 'triceps'],
  selectedFilter = null,
  onSelectMuscle
}) {
  const isTargeted = (muscleId) => {
    return activeMuscles.some(m => m.toLowerCase().includes(muscleId.toLowerCase()));
  };

  const isSelected = (muscleId) => {
    return selectedFilter && selectedFilter.toLowerCase() === muscleId.toLowerCase();
  };

  const handleMuscleClick = (muscleId) => {
    if (onSelectMuscle) {
      if (isSelected(muscleId)) {
        onSelectMuscle(null); // toggle off
      } else {
        onSelectMuscle(muscleId);
      }
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl flex flex-col items-center justify-between text-center space-y-4 relative overflow-hidden">
      
      <div className="w-full flex items-center justify-between">
        <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" /> INTERACTIVE BODY MAP
        </h4>
        {selectedFilter && (
          <button
            onClick={() => onSelectMuscle && onSelectMuscle(null)}
            className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-400 text-[10px] font-bold flex items-center gap-1 hover:bg-rose-500/30 transition-all"
          >
            <X className="w-3 h-3" /> Reset Filter
          </button>
        )}
      </div>

      <p className="text-[10px] text-[var(--text-secondary)] font-medium">
        Click any muscle region on the body map below to filter exercises by body part!
      </p>

      {/* SVG Interactive Human Body Map */}
      <div className="relative w-36 h-56 flex items-center justify-center my-1 group">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 200" fill="none">
          {/* Head */}
          <circle cx="50" cy="20" r="12" className="fill-[var(--bg-tertiary)] stroke-[var(--border-color)]" strokeWidth="1.5" />
          
          {/* Chest */}
          <path
            d="M 35 38 Q 50 36 65 38 L 62 60 Q 50 62 38 60 Z"
            onClick={() => handleMuscleClick('chest')}
            className={`cursor-pointer transition-all ${
              isSelected('chest')
                ? 'fill-[var(--accent-primary)] stroke-white stroke-2 scale-105'
                : isTargeted('chest')
                  ? 'fill-[var(--accent-primary)] stroke-[var(--accent-primary)] animate-pulse hover:opacity-80'
                  : 'fill-[var(--bg-tertiary)] stroke-[var(--border-color)] hover:fill-[var(--accent-glow)]'
            }`}
            strokeWidth="1.5"
          />

          {/* Shoulders */}
          <circle
            cx="28" cy="42" r="7"
            onClick={() => handleMuscleClick('shoulders')}
            className={`cursor-pointer transition-all ${
              isSelected('shoulders')
                ? 'fill-[var(--accent-primary)] stroke-white stroke-2'
                : isTargeted('shoulders') ? 'fill-[var(--accent-primary)] hover:opacity-80' : 'fill-[var(--bg-tertiary)] hover:fill-[var(--accent-glow)]'
            }`}
          />
          <circle
            cx="72" cy="42" r="7"
            onClick={() => handleMuscleClick('shoulders')}
            className={`cursor-pointer transition-all ${
              isSelected('shoulders')
                ? 'fill-[var(--accent-primary)] stroke-white stroke-2'
                : isTargeted('shoulders') ? 'fill-[var(--accent-primary)] hover:opacity-80' : 'fill-[var(--bg-tertiary)] hover:fill-[var(--accent-glow)]'
            }`}
          />

          {/* Arms / Biceps / Triceps */}
          <rect
            x="20" y="50" width="8" height="26" rx="4"
            onClick={() => handleMuscleClick('biceps')}
            className={`cursor-pointer transition-all ${
              isSelected('biceps')
                ? 'fill-[var(--accent-primary)] stroke-white stroke-2'
                : isTargeted('triceps') || isTargeted('biceps') ? 'fill-[var(--accent-primary)]' : 'fill-[var(--bg-tertiary)] hover:fill-[var(--accent-glow)]'
            }`}
          />
          <rect
            x="72" y="50" width="8" height="26" rx="4"
            onClick={() => handleMuscleClick('biceps')}
            className={`cursor-pointer transition-all ${
              isSelected('biceps')
                ? 'fill-[var(--accent-primary)] stroke-white stroke-2'
                : isTargeted('triceps') || isTargeted('biceps') ? 'fill-[var(--accent-primary)]' : 'fill-[var(--bg-tertiary)] hover:fill-[var(--accent-glow)]'
            }`}
          />

          {/* Abs / Core */}
          <rect
            x="40" y="64" width="20" height="30" rx="3"
            onClick={() => handleMuscleClick('abs')}
            className={`cursor-pointer transition-all ${
              isSelected('abs')
                ? 'fill-[var(--accent-primary)] stroke-white stroke-2'
                : isTargeted('core') || isTargeted('abs') ? 'fill-[var(--accent-primary)]' : 'fill-[var(--bg-tertiary)] hover:fill-[var(--accent-glow)]'
            }`}
          />

          {/* Quads / Legs */}
          <rect
            x="36" y="98" width="12" height="45" rx="5"
            onClick={() => handleMuscleClick('quads')}
            className={`cursor-pointer transition-all ${
              isSelected('quads')
                ? 'fill-[var(--accent-primary)] stroke-white stroke-2'
                : isTargeted('quads') || isTargeted('quadriceps') || isTargeted('legs') ? 'fill-[var(--accent-primary)]' : 'fill-[var(--bg-tertiary)] hover:fill-[var(--accent-glow)]'
            }`}
          />
          <rect
            x="52" y="98" width="12" height="45" rx="5"
            onClick={() => handleMuscleClick('quads')}
            className={`cursor-pointer transition-all ${
              isSelected('quads')
                ? 'fill-[var(--accent-primary)] stroke-white stroke-2'
                : isTargeted('quads') || isTargeted('quadriceps') || isTargeted('legs') ? 'fill-[var(--accent-primary)]' : 'fill-[var(--bg-tertiary)] hover:fill-[var(--accent-glow)]'
            }`}
          />

          {/* Calves */}
          <rect
            x="38" y="148" width="8" height="36" rx="4"
            onClick={() => handleMuscleClick('calves')}
            className={`cursor-pointer transition-all ${
              isSelected('calves')
                ? 'fill-[var(--accent-primary)] stroke-white stroke-2'
                : isTargeted('calves') ? 'fill-[var(--accent-primary)]' : 'fill-[var(--bg-tertiary)] hover:fill-[var(--accent-glow)]'
            }`}
          />
          <rect
            x="54" y="148" width="8" height="36" rx="4"
            onClick={() => handleMuscleClick('calves')}
            className={`cursor-pointer transition-all ${
              isSelected('calves')
                ? 'fill-[var(--accent-primary)] stroke-white stroke-2'
                : isTargeted('calves') ? 'fill-[var(--accent-primary)]' : 'fill-[var(--bg-tertiary)] hover:fill-[var(--accent-glow)]'
            }`}
          />
        </svg>
      </div>

      {/* Interactive Muscle Group Filter Chips */}
      <div className="space-y-1.5 w-full">
        <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider block">
          Filter Exercises by Body Part:
        </span>
        <div className="flex flex-wrap gap-1.5 justify-center text-[10px]">
          {MUSCLE_PARTS.map((m) => {
            const active = isSelected(m.id);
            return (
              <button
                key={m.id}
                onClick={() => handleMuscleClick(m.id)}
                className={`px-2.5 py-1 rounded-lg border font-bold uppercase transition-all flex items-center gap-1 ${
                  active
                    ? 'bg-[var(--accent-primary)] text-slate-950 border-[var(--accent-primary)] shadow-md'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/50'
                }`}
              >
                {active && <Check className="w-3 h-3 stroke-[3]" />}
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
