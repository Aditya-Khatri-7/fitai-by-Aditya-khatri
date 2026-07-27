import React from 'react';
import { useSelector } from 'react-redux';
import { User } from 'lucide-react';

export function DietaryProfile() {
  const { user } = useSelector(state => state.auth);
  const pref = user?.preferences || {};
  const health = user?.healthProfile || {};

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
        <User className="w-4 h-4 text-[var(--accent-primary)]" /> DIETARY PREFERENCES & ALLERGIES
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase">Diet Type</span>
          <p className="font-extrabold text-[var(--text-primary)] capitalize mt-0.5">{pref.dietType || 'Omnivore'}</p>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase">Budget</span>
          <p className="font-extrabold text-[var(--text-primary)] capitalize mt-0.5">{pref.budget || 'Medium'}</p>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase">Cooking Skill</span>
          <p className="font-extrabold text-[var(--text-primary)] capitalize mt-0.5">{pref.cookingSkill || 'Intermediate'}</p>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase">Allergies</span>
          <p className="font-extrabold text-rose-400 mt-0.5">{health.allergies?.join(', ') || 'None'}</p>
        </div>
      </div>
    </div>
  );
}
