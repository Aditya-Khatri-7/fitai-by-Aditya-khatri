import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateProfile } from '../../redux/slices/authSlice';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const GOAL_TYPE_OPTIONS = [
  { id: 'muscle_gain', label: 'Muscle Gain', unit: 'kg' },
  { id: 'weight_loss', label: 'Weight Loss', unit: 'kg' },
  { id: 'endurance', label: 'Endurance', unit: 'km' },
  { id: 'strength', label: 'Strength', unit: 'kg' },
  { id: 'general_fitness', label: 'General Fitness', unit: '' }
];

export function ProfileEditModal({ user, onClose }) {
  const dispatch = useDispatch();
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    age: user?.profile?.age ?? '',
    gender: user?.profile?.gender || 'male',
    height: user?.profile?.height ?? '',
    weight: user?.profile?.weight ?? '',
    bodyFatPercentage: user?.profile?.bodyFatPercentage ?? '',
    fitnessLevel: user?.profile?.fitnessLevel || 'intermediate',
    activityLevel: user?.profile?.activityLevel || 'moderate'
  });

  const [goal, setGoal] = useState({
    type: user?.currentGoal?.type || 'muscle_gain',
    targetValue: user?.currentGoal?.targetValue ?? '',
    startValue: user?.currentGoal?.startValue ?? '',
    unit: user?.currentGoal?.unit || 'kg',
    deadline: user?.currentGoal?.deadline ? user.currentGoal.deadline.split('T')[0] : ''
  });

  const [preferences, setPreferences] = useState({
    dietType: user?.preferences?.dietType || 'omnivore',
    budget: user?.preferences?.budget || 'medium',
    cookingSkill: user?.preferences?.cookingSkill || 'intermediate'
  });

  const [allergies, setAllergies] = useState((user?.healthProfile?.allergies || []).join(', '));

  const handleSave = async () => {
    setSaving(true);
    const numeric = (v) => (v === '' || v === null ? undefined : Number(v));
    const result = await dispatch(updateProfile({
      profile: {
        age: numeric(profile.age),
        gender: profile.gender,
        height: numeric(profile.height),
        weight: numeric(profile.weight),
        bodyFatPercentage: numeric(profile.bodyFatPercentage),
        fitnessLevel: profile.fitnessLevel,
        activityLevel: profile.activityLevel
      },
      currentGoal: {
        type: goal.type,
        targetValue: numeric(goal.targetValue),
        startValue: numeric(goal.startValue),
        unit: goal.unit,
        deadline: goal.deadline || undefined
      },
      preferences,
      healthProfile: {
        allergies: allergies.split(',').map(a => a.trim()).filter(Boolean)
      }
    }));
    setSaving(false);
    if (updateProfile.fulfilled.match(result)) {
      toast.success('Profile updated!');
      onClose();
    } else {
      toast.error(result.payload || 'Failed to update profile');
    }
  };

  const inputCls = "w-full p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-primary)]";
  const labelCls = "text-[var(--text-secondary)] font-bold block mb-1 text-[11px]";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <h3 className="text-lg font-extrabold text-[var(--text-primary)]">Edit Profile</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h4 className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider mb-2">Body Composition</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Age</label>
              <input type="number" className={inputCls} value={profile.age} onChange={e => setProfile({ ...profile, age: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Gender</label>
              <select className={inputCls} value={profile.gender} onChange={e => setProfile({ ...profile, gender: e.target.value })}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Height (cm)</label>
              <input type="number" className={inputCls} value={profile.height} onChange={e => setProfile({ ...profile, height: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Weight (kg)</label>
              <input type="number" className={inputCls} value={profile.weight} onChange={e => setProfile({ ...profile, weight: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Body Fat %</label>
              <input type="number" className={inputCls} value={profile.bodyFatPercentage} onChange={e => setProfile({ ...profile, bodyFatPercentage: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Fitness Level</label>
              <select className={inputCls} value={profile.fitnessLevel} onChange={e => setProfile({ ...profile, fitnessLevel: e.target.value })}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="athlete">Athlete</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Activity Level</label>
              <select className={inputCls} value={profile.activityLevel} onChange={e => setProfile({ ...profile, activityLevel: e.target.value })}>
                <option value="sedentary">Sedentary</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
                <option value="very_active">Very Active</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider mb-2">Fitness Goal</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Goal Type</label>
              <select
                className={inputCls}
                value={goal.type}
                onChange={e => {
                  const opt = GOAL_TYPE_OPTIONS.find(o => o.id === e.target.value);
                  setGoal({ ...goal, type: e.target.value, unit: opt?.unit || goal.unit });
                }}
              >
                {GOAL_TYPE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Start Value</label>
              <input type="number" className={inputCls} value={goal.startValue} onChange={e => setGoal({ ...goal, startValue: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Target Value</label>
              <input type="number" className={inputCls} value={goal.targetValue} onChange={e => setGoal({ ...goal, targetValue: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Unit</label>
              <input type="text" className={inputCls} value={goal.unit} onChange={e => setGoal({ ...goal, unit: e.target.value })} />
            </div>
            <div className="col-span-3">
              <label className={labelCls}>Deadline</label>
              <input type="date" className={inputCls} value={goal.deadline} onChange={e => setGoal({ ...goal, deadline: e.target.value })} />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider mb-2">Nutrition Preferences</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Diet Type</label>
              <select className={inputCls} value={preferences.dietType} onChange={e => setPreferences({ ...preferences, dietType: e.target.value })}>
                <option value="omnivore">Omnivore</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="pescatarian">Pescatarian</option>
                <option value="keto">Keto</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Budget</label>
              <select className={inputCls} value={preferences.budget} onChange={e => setPreferences({ ...preferences, budget: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Cooking Skill</label>
              <select className={inputCls} value={preferences.cookingSkill} onChange={e => setPreferences({ ...preferences, cookingSkill: e.target.value })}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <label className={labelCls}>Allergies (comma separated)</label>
              <input type="text" className={inputCls} placeholder="e.g. peanuts, shellfish" value={allergies} onChange={e => setAllergies(e.target.value)} />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
