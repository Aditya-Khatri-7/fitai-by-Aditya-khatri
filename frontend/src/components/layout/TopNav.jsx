import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCommandPaletteOpen, setWearableModalOpen, toggleSidebar } from '../../redux/slices/uiSlice';
import { logout } from '../../redux/slices/authSlice';
import { useTheme } from '../../context/ThemeContext';
import { StreakFlame } from '../common/StreakFlame';
import { Search, Watch, Command, LogOut, User, Palette, Menu } from 'lucide-react';

export function TopNav() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { setIsThemeSwitcherOpen, mobileMode, isNarrowViewport } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const isDrawerLayout = mobileMode || isNarrowViewport;

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 bg-[var(--bg-secondary)]/95 backdrop-blur-xl border-b border-[var(--border-color)] px-3 sm:px-6 flex items-center justify-between gap-2 transition-colors">

      {/* Left Area: Mobile Menu Trigger & Search */}
      <div className="flex items-center gap-2 min-w-0">
        {isDrawerLayout && (
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--accent-glow)] hover:text-[var(--accent-primary)] transition-all shrink-0"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Search / Command Palette Trigger */}
        <button
          onClick={() => dispatch(setCommandPaletteOpen(true))}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50 transition-all text-xs ${
            mobileMode ? 'w-24' : 'w-36 sm:w-72'
          }`}
        >
          <Search className="w-3.5 h-3.5 shrink-0 text-[var(--text-secondary)]" />
          <span className="truncate">{mobileMode ? 'Search...' : 'Search workout, meal...'}</span>
          {!mobileMode && (
            <kbd className="hidden md:flex ml-auto px-2 py-0.5 text-[10px] bg-[var(--bg-primary)] rounded border border-[var(--border-color)] font-mono text-[var(--text-tertiary)] items-center gap-1">
              <Command className="w-3 h-3" /> K
            </kbd>
          )}
        </button>
      </div>

      {/* Right Quick Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        
        {/* Gamified Streak Flame Badge */}
        <StreakFlame />

        {/* Wearable Sync Button */}
        <button
          onClick={() => dispatch(setWearableModalOpen(true))}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 hover:border-[var(--accent-primary)]/60 transition-all text-xs font-semibold shrink-0"
          title="Sync Wearable Data"
        >
          <Watch className="w-3.5 h-3.5 animate-spin-slow text-[var(--accent-primary)] shrink-0" />
          {!mobileMode && <span className="hidden sm:inline">Sync Wearable</span>}
        </button>

        {/* Theme Studio Palette Icon */}
        <button
          onClick={() => setIsThemeSwitcherOpen(true)}
          title="Theme Studio"
          className="p-1.5 sm:p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/50 transition-all shrink-0"
        >
          <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* User Profile Dropdown / Direct Avatar Link */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors border border-transparent hover:border-[var(--border-color)]"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
              alt={user?.name}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-[var(--accent-primary)]/40 shrink-0"
            />
            {!mobileMode && (
              <div className="hidden lg:block text-left text-xs">
                <p className="font-semibold text-[var(--text-primary)] truncate max-w-[100px]">{user?.name || 'User'}</p>
                <p className="text-[10px] text-[var(--accent-primary)] font-medium capitalize truncate max-w-[100px]">{user?.currentGoal?.type?.replace('_', ' ') || 'Fitness Enthusiast'}</p>
              </div>
            )}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-semibold"
              >
                <User className="w-4 h-4 text-[var(--accent-primary)]" /> User Profile & RPG Hub
              </button>
              <button
                onClick={() => { setShowProfileMenu(false); dispatch(logout()); navigate('/'); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-400 font-semibold"
              >
                <LogOut className="w-4 h-4" /> Reset / Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
