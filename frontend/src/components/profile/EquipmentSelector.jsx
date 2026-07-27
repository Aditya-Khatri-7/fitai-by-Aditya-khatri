import React from 'react';
import { Check } from 'lucide-react';

export function EquipmentSelector({ selected = [], onChange }) {
  const allEquipment = [
    { id: 'barbell', label: 'Barbell & Plates' },
    { id: 'dumbbell', label: 'Dumbbells' },
    { id: 'cable', label: 'Cable Machine' },
    { id: 'machine', label: 'Gym Machines' },
    { id: 'rack', label: 'Squat Power Rack' },
    { id: 'bench', label: 'Adjustable Bench' },
    { id: 'kettlebell', label: 'Kettlebells' },
    { id: 'resistance_band', label: 'Resistance Bands' },
    { id: 'pull_up_bar', label: 'Pull-Up Bar' },
    { id: 'bodyweight_only', label: 'Bodyweight Only' }
  ];

  const toggleEq = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter(item => item !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
      {allEquipment.map((eq) => {
        const isSel = selected.includes(eq.id);
        return (
          <button
            type="button"
            key={eq.id}
            onClick={() => toggleEq(eq.id)}
            className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all ${
              isSel
                ? 'bg-[var(--accent-glow)] border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-md'
                : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]'
            }`}
          >
            <span className="truncate">{eq.label}</span>
            {isSel && <Check className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}
