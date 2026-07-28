import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, Apple, Menu } from 'lucide-react';
import { MoreMenu } from './MoreMenu';

const TABS = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/workouts', label: 'Workout', icon: Dumbbell },
  { path: '/nutrition', label: 'Nutrition', icon: Apple }
];

// Real mobile-native bottom tab bar replacing the desktop left sidebar. "More" opens
// a sheet holding everything else (Health, Calendar, Analytics, Profile, settings)
// instead of cramming a 9-item nav into 4 tabs.
export function BottomNav() {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = !TABS.some(t => location.pathname.startsWith(t.path));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-[var(--sidebar-bg)] border-t border-[var(--border-color)] flex items-stretch px-1 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors ${
                  isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
        <button
          onClick={() => setShowMore(true)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors ${
            isMoreActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>

      <MoreMenu isOpen={showMore} onClose={() => setShowMore(false)} />
    </>
  );
}
