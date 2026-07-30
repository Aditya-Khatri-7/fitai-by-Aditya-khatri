import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../../redux/slices/authSlice';
import { generateMealPlan } from '../../redux/slices/nutritionSlice';
import { User, Globe2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const CUISINES = [
  { value: 'any', label: 'No Preference' },
  { value: 'north', label: 'North Indian' },
  { value: 'south', label: 'South Indian' },
  { value: 'east', label: 'East Indian' },
  { value: 'west', label: 'West Indian' }
];

const DIET_TYPES = [
  { value: 'omnivore', label: 'Non-Vegetarian' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'eggetarian', label: 'Eggetarian' }
];

const MEAL_SLOTS = ['breakfast', 'lunch', 'snack', 'dinner'];

// Real, editable diet & cuisine selection — previously this card only displayed
// diet type/budget/cooking skill/allergies read-only with no way to change them
// (onboarding never asked, and this card had no edit controls for them at all).
export function DietaryProfile() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const pref = user?.preferences || {};
  const health = user?.healthProfile || {};

  const [dietType, setDietType] = useState(pref.dietType || 'omnivore');
  const [budget, setBudget] = useState(pref.budget || 'medium');
  const [cookingSkill, setCookingSkill] = useState(pref.cookingSkill || 'intermediate');
  const [allergiesText, setAllergiesText] = useState((health.allergies || []).join(', '));
  const [cuisine, setCuisine] = useState(pref.cuisine || 'any');
  const [cuisinePerMeal, setCuisinePerMeal] = useState(pref.cuisinePerMeal || {});
  const [saving, setSaving] = useState(false);

  const dirty = cuisine !== (pref.cuisine || 'any')
    || dietType !== (pref.dietType || 'omnivore')
    || budget !== (pref.budget || 'medium')
    || cookingSkill !== (pref.cookingSkill || 'intermediate')
    || allergiesText !== (health.allergies || []).join(', ')
    || MEAL_SLOTS.some(s => (cuisinePerMeal[s] || '') !== (pref.cuisinePerMeal?.[s] || ''));

  const handleSave = async () => {
    setSaving(true);
    const allergies = allergiesText.split(',').map(a => a.trim()).filter(Boolean);
    const result = await dispatch(updateProfile({
      preferences: { cuisine, cuisinePerMeal, dietType, budget, cookingSkill },
      healthProfile: { allergies }
    }));
    setSaving(false);
    if (updateProfile.fulfilled.match(result)) {
      toast.success('Dietary preferences saved!');
      const regen = await dispatch(generateMealPlan());
      if (generateMealPlan.fulfilled.match(regen)) {
        toast.success("Today's meal plan updated to match your new preferences.");
      }
    } else {
      toast.error(result.payload || 'Failed to save preferences');
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
        <User className="w-4 h-4 text-[var(--accent-primary)]" /> DIETARY PREFERENCES & ALLERGIES
      </h3>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <label className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase">Diet Type</label>
          <select value={dietType} onChange={(e) => setDietType(e.target.value)} className="w-full px-2.5 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]">
            {DIET_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase">Budget</label>
          <select value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full px-2.5 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase">Cooking Skill</label>
          <select value={cookingSkill} onChange={(e) => setCookingSkill(e.target.value)} className="w-full px-2.5 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase">Allergies</label>
          <input
            type="text"
            value={allergiesText}
            onChange={(e) => setAllergiesText(e.target.value)}
            placeholder="e.g. Peanuts, Shellfish"
            className="w-full px-2.5 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[11px] font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>
      </div>

      <div className="pt-3 border-t border-[var(--border-color)] space-y-3">
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
          <Globe2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Regional Cuisine Preference
        </span>

        <div className="space-y-1">
          <label className="text-[10px] text-[var(--text-secondary)] font-semibold">Overall (used unless overridden per meal below)</label>
          <select
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          >
            {CUISINES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {MEAL_SLOTS.map(slot => (
            <div key={slot} className="space-y-1">
              <label className="text-[10px] text-[var(--text-secondary)] font-semibold capitalize">{slot}</label>
              <select
                value={cuisinePerMeal[slot] || ''}
                onChange={(e) => setCuisinePerMeal(prev => ({ ...prev, [slot]: e.target.value }))}
                className="w-full px-2 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[11px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              >
                <option value="">Use overall</option>
                {CUISINES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          ))}
        </div>

        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)] text-slate-950 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save & Regenerate Today\'s Plan'}
          </button>
        )}
      </div>
    </div>
  );
}
