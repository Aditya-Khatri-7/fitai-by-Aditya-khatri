import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setWearableModalOpen } from '../../redux/slices/uiSlice';
import { Dumbbell, Utensils, Watch, Stethoscope } from 'lucide-react';

export function QuickActions() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const actions = [
    { label: 'Start Workout', icon: Dumbbell, color: 'from-cyan-500 to-blue-600', text: 'text-slate-950', onClick: () => navigate('/workouts') },
    { label: 'Log Meal Plan', icon: Utensils, color: 'from-purple-600 to-pink-600', text: 'text-white', onClick: () => navigate('/nutrition') },
    { label: 'Sync Wearable Data', icon: Watch, color: 'from-emerald-500 to-teal-600', text: 'text-slate-950', onClick: () => dispatch(setWearableModalOpen(true)) },
    { label: 'Update Health Status', icon: Stethoscope, color: 'from-rose-500 to-amber-600', text: 'text-slate-950', onClick: () => navigate('/health-update') }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((act, idx) => {
        const Icon = act.icon;
        return (
          <button
            key={idx}
            onClick={act.onClick}
            className={`p-4 rounded-2xl bg-gradient-to-r ${act.color} ${act.text} font-bold text-xs shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-between group`}
          >
            <span>{act.label}</span>
            <Icon className="w-5 h-5 opacity-90 group-hover:translate-x-0.5 transition-transform" />
          </button>
        );
      })}
    </div>
  );
}
