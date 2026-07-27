import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCommandPaletteOpen, setWearableModalOpen } from '../../redux/slices/uiSlice';
import { Search, LayoutDashboard, Dumbbell, Apple, HeartPulse, Bot, BarChart3, Calendar, User, X } from 'lucide-react';

export function CommandPalette() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isCommandPaletteOpen } = useSelector(state => state.ui);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        dispatch(setCommandPaletteOpen(!isCommandPaletteOpen));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const actions = [
    { title: 'Go to Main Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { title: 'Today\'s Adaptive Workout Builder', icon: Dumbbell, path: '/workouts' },
    { title: 'AI Meal Planner & Nutrition Tracker', icon: Apple, path: '/nutrition' },
    { title: 'Simulate Wearable Device Sync', icon: HeartPulse, action: () => dispatch(setWearableModalOpen(true)) },
    { title: 'Launch 3D AI Coach Avatar Studio', icon: Bot, path: '/ai-coach' },
    { title: 'View Health & Fatigue Analytics', icon: BarChart3, path: '/analytics' },
    { title: 'Open Smart Workout Calendar', icon: Calendar, path: '/calendar' },
    { title: 'Manage Health & Chronic Conditions Profile', icon: User, path: '/profile' }
  ];

  const filtered = actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-cyan-400" />
          <input
            type="text"
            placeholder="Type a command or page name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-sm font-medium"
            autoFocus
          />
          <button
            onClick={() => dispatch(setCommandPaletteOpen(false))}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  dispatch(setCommandPaletteOpen(false));
                  if (item.action) item.action();
                  else if (item.path) navigate(item.path);
                }}
                className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-purple-500/10 text-slate-200 hover:text-cyan-400 text-xs font-semibold transition-all group"
              >
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 shrink-0" />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
