import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
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
      mobileMode ? 'h-[832px] max-h-[832px] overflow-hidden w-full' : 'min-h-screen'
    }`}>
      <Sidebar />

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
              ? 'p-3.5 h-[calc(832px-60px)] overflow-y-auto scrollbar-none'
              : isNarrowViewport
              ? 'p-3.5 overflow-y-visible'
              : 'p-6 md:p-8 max-w-7xl overflow-y-visible'
          }`}
        >
          {children}
        </main>
      </div>

      <CommandPalette />
      <WearableSync />
      <ThemeSwitcher />
    </div>
  );
}
