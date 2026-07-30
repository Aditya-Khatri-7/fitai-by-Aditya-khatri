import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, Apple, Menu } from 'lucide-react';
import { MoreMenu, MORE_LINKS } from './MoreMenu';

const TABS = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/workouts', label: 'Workout', icon: Dumbbell },
  { path: '/nutrition', label: 'Nutrition', icon: Apple }
];

// Real mobile-native bottom tab bar replacing the desktop left sidebar. "More" opens
// a sheet holding everything else (Health, Calendar, Analytics, Profile, settings)
// instead of cramming a 9-item nav into 4 tabs. When the user is on a page that only
// lives inside that sheet (e.g. Profile), the More tab swaps its generic icon/label
// for that section's own icon/label so it's clear which screen is open — tapping it
// still reopens the sheet rather than navigating, since More itself has no own route.
export function BottomNav() {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const activeMoreLink = MORE_LINKS.find(l => location.pathname.startsWith(l.path));
  const isMoreActive = !!activeMoreLink;
  const MoreIcon = activeMoreLink ? activeMoreLink.icon : Menu;
  const moreLabel = activeMoreLink ? activeMoreLink.label.split(' ')[0] : 'More';

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--sidebar-bg)] border-t border-[var(--border-color)] flex items-stretch px-1"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch flex-1 h-16">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className="flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors"
              >
                {({ isActive }) => (
                  <span className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                    isActive ? 'bg-[var(--accent-glow)] text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'
                  }`}>
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </span>
                )}
              </NavLink>
            );
          })}
          <button
            onClick={() => setShowMore(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors"
          >
            <span className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all max-w-full ${
              isMoreActive ? 'bg-[var(--accent-glow)] text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'
            }`}>
              <MoreIcon className="w-5 h-5 shrink-0" />
              <span className="truncate max-w-[64px]">{moreLabel}</span>
            </span>
          </button>
        </div>
      </nav>

      <MoreMenu isOpen={showMore} onClose={() => setShowMore(false)} />
    </>
  );
}
