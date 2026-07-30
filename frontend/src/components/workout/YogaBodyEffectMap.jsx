import React from 'react';
import { Flower2 } from 'lucide-react';

const REGIONS = [
  { id: 'chest', label: 'Chest', keyWords: ['chest'] },
  { id: 'shoulders', label: 'Shoulders', keyWords: ['shoulders'] },
  { id: 'arms', label: 'Arms', keyWords: ['triceps', 'biceps', 'forearms'] },
  { id: 'core', label: 'Core & Abs', keyWords: ['core', 'abdominals', 'obliques'] },
  { id: 'back', label: 'Back & Spine', keyWords: ['lower_back'] },
  { id: 'hips', label: 'Hips & Groin', keyWords: ['hips', 'groin', 'hip_flexors'] },
  { id: 'legs', label: 'Legs', keyWords: ['quadriceps', 'hamstrings', 'calves', 'glutes', 'ankles'] }
];

function classifyRegion(region, strengthenedSet, stretchedSet) {
  const strengthened = region.keyWords.some(k => strengthenedSet.has(k));
  const stretched = region.keyWords.some(k => stretchedSet.has(k));
  if (strengthened && stretched) return 'both';
  if (strengthened) return 'strengthened';
  if (stretched) return 'stretched';
  return 'none';
}

const REGION_FILL = {
  strengthened: 'fill-[var(--accent-primary)]',
  stretched: 'fill-sky-400',
  both: 'fill-emerald-400',
  none: 'fill-[var(--bg-tertiary)]'
};

/** Parallel to MuscleHeatmap.jsx, but for yoga sessions: shows which body parts a
 * pose sequence stretches vs strengthens instead of a single "targeted" state,
 * aggregated from each exercise's muscleGroups (primary=strengthened, secondary=stretched
 * per poseToExercise() in yogaService.js). */
export function YogaBodyEffectMap({ exercises = [] }) {
  const strengthenedSet = new Set(exercises.flatMap(e => e.muscleGroups?.primary || []).map(m => m.toLowerCase()));
  const stretchedSet = new Set(exercises.flatMap(e => e.muscleGroups?.secondary || []).map(m => m.toLowerCase()));

  const regionStates = Object.fromEntries(REGIONS.map(r => [r.id, classifyRegion(r, strengthenedSet, stretchedSet)]));

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl flex flex-col items-center justify-between text-center space-y-4">
      <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5 w-full">
        <Flower2 className="w-4 h-4 text-[var(--accent-primary)]" /> BODY EFFECT MAP
      </h4>
      <p className="text-[10px] text-[var(--text-secondary)] font-medium">
        Which parts of your body this flow stretches vs strengthens.
      </p>

      <div className="relative w-36 h-56 flex items-center justify-center my-1">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 200" fill="none">
          <circle cx="50" cy="20" r="12" className="fill-[var(--bg-tertiary)] stroke-[var(--border-color)]" strokeWidth="1.5" />
          <path d="M 35 38 Q 50 36 65 38 L 62 60 Q 50 62 38 60 Z" className={`${REGION_FILL[regionStates.chest]} stroke-[var(--border-color)]`} strokeWidth="1.5" />
          <circle cx="28" cy="42" r="7" className={REGION_FILL[regionStates.shoulders]} />
          <circle cx="72" cy="42" r="7" className={REGION_FILL[regionStates.shoulders]} />
          <rect x="20" y="50" width="8" height="26" rx="4" className={REGION_FILL[regionStates.arms]} />
          <rect x="72" y="50" width="8" height="26" rx="4" className={REGION_FILL[regionStates.arms]} />
          <rect x="40" y="64" width="20" height="30" rx="3" className={REGION_FILL[regionStates.core]} />
          <rect x="30" y="92" width="10" height="14" rx="3" className={REGION_FILL[regionStates.hips]} />
          <rect x="60" y="92" width="10" height="14" rx="3" className={REGION_FILL[regionStates.hips]} />
          <rect x="36" y="98" width="12" height="45" rx="5" className={REGION_FILL[regionStates.legs]} />
          <rect x="52" y="98" width="12" height="45" rx="5" className={REGION_FILL[regionStates.legs]} />
          <rect x="38" y="148" width="8" height="36" rx="4" className={REGION_FILL[regionStates.legs]} />
          <rect x="54" y="148" width="8" height="36" rx="4" className={REGION_FILL[regionStates.legs]} />
        </svg>
      </div>

      <div className="flex items-center justify-center gap-3 text-[10px] font-bold">
        <span className="flex items-center gap-1 text-[var(--text-secondary)]"><span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] inline-block" /> Strengthened</span>
        <span className="flex items-center gap-1 text-[var(--text-secondary)]"><span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> Stretched</span>
        <span className="flex items-center gap-1 text-[var(--text-secondary)]"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Both</span>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center text-[10px] w-full">
        {REGIONS.filter(r => regionStates[r.id] !== 'none').map(r => (
          <span
            key={r.id}
            className="px-2.5 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-bold uppercase"
          >
            {r.label}
          </span>
        ))}
      </div>
    </div>
  );
}
