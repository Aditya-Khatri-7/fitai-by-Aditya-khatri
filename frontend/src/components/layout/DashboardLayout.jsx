import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';
import { CommandPalette } from './CommandPalette';
import { WearableSync } from '../health/WearableSync';
import { ThemeSwitcher } from '../ui/ThemeSwitcher';
import { useTheme } from '../../context/ThemeContext';

export function DashboardLayout({ children }) {
  const location = useLocation();
  const { isSidebarOpen } = useSelector(state => state.ui);
  const { mobileMode, isNarrowViewport } = useTheme();
  const isDrawerLayout = mobileMode || isNarrowViewport;

  return (
    <div className={`bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans transition-colors relative ${
      mobileMode ? 'h-full w-full overflow-hidden' : 'min-h-screen'
    }`}>
      {/* Real mobile-native bottom tab bar replaces the left sidebar entirely on
          narrow layouts, instead of the old hamburger + slide-over drawer. */}
      {!isDrawerLayout && <Sidebar />}

      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${
          isDrawerLayout
            ? 'pl-0 h-full overflow-hidden'
            : isSidebarOpen ? 'pl-64' : 'pl-20'
        }`}
      >
        <TopNav />

        {/* Gamified Section Entrance Transition on Navbar Route Changes */}
        <main
          key={location.pathname}
          className={`flex-1 w-full mx-auto space-y-6 animate-in fade-in zoom-in-95 slide-in-from-right-4 duration-300 ${
            mobileMode
              ? 'p-3.5 pb-20 h-[calc(100%-56px)] overflow-y-auto scrollbar-none'
              : isNarrowViewport
              ? 'p-3.5 pb-24 overflow-y-visible'
              : 'p-6 md:p-8 max-w-7xl overflow-y-visible'
          }`}
        >
          {children}
        </main>

        {isDrawerLayout && <BottomNav />}
      </div>

      <CommandPalette />
      <WearableSync />
      <ThemeSwitcher />
    </div>
  );
}
