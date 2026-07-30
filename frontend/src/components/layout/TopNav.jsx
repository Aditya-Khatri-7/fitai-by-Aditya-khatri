import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCommandPaletteOpen, setWearableModalOpen, setHelpCenterOpen } from '../../redux/slices/uiSlice';
import { logout } from '../../redux/slices/authSlice';
import { useTheme } from '../../context/ThemeContext';
import { StreakFlame } from '../common/StreakFlame';
import { Search, Watch, Command, LogOut, User, Palette, Sun, Moon, Zap } from 'lucide-react';

export function TopNav() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { setIsThemeSwitcherOpen, mobileMode, isNarrowViewport, isLightTheme, toggleLightDark } = useTheme();
  const isCompact = mobileMode || isNarrowViewport;
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header
      className="sticky top-0 z-30 bg-[var(--bg-secondary)]/95 backdrop-blur-xl border-b border-[var(--border-color)] transition-colors"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className={`h-14 sm:h-16 flex items-center justify-between gap-2 ${isCompact ? 'px-3 gap-1.5' : 'px-3 sm:px-6 gap-2'}`}>

        {/* Left Area — mobile shows the FitAI mark so the bar reads as balanced
            (logo + search on the left, streak + avatar on the right — 2 & 2)
            instead of lopsided with everything crammed on one side. */}
        <div className="flex items-center gap-2 min-w-0">
          {isCompact && (
            <button
              onClick={() => dispatch(setHelpCenterOpen(true))}
              title="Help & How FitAI Works"
              className="w-8 h-8 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center text-[var(--accent-primary)] shrink-0 border border-[var(--accent-primary)]/30 active:scale-95 transition-transform"
            >
              <Zap className="w-4 h-4 fill-current" />
            </button>
          )}

          {/* Search / Command Palette Trigger */}
          <button
            onClick={() => dispatch(setCommandPaletteOpen(true))}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50 transition-all text-xs shrink-0 ${
              isCompact ? 'w-9 px-2 justify-center' : 'w-36 sm:w-72'
            }`}
            title="Search"
          >
            <Search className="w-3.5 h-3.5 shrink-0 text-[var(--text-secondary)]" />
            {!isCompact && <span className="truncate">Search workout, meal...</span>}
            {!isCompact && (
              <kbd className="hidden md:flex ml-auto px-2 py-0.5 text-[10px] bg-[var(--bg-primary)] rounded border border-[var(--border-color)] font-mono text-[var(--text-tertiary)] items-center gap-1">
                <Command className="w-3 h-3" /> K
              </kbd>
            )}
          </button>
        </div>

        {/* Right Quick Actions — on mobile this collapses to just Streak + Avatar
            (2 items, matching the left) with Theme/Theme Studio/Wearable Sync
            relocated into the avatar dropdown so nothing is actually lost. */}
        <div className={`flex items-center shrink-0 ${isCompact ? 'gap-1.5' : 'gap-1.5 sm:gap-3'}`}>

          {/* Gamified Streak Flame Badge */}
          <StreakFlame />

          {!isCompact && (
            <>
              {/* Wearable Sync Button */}
              <button
                onClick={() => dispatch(setWearableModalOpen(true))}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 hover:border-[var(--accent-primary)]/60 transition-all text-xs font-semibold shrink-0"
                title="Sync Wearable Data"
              >
                <Watch className="w-3.5 h-3.5 animate-spin-slow text-[var(--accent-primary)] shrink-0" />
                <span className="hidden sm:inline">Sync Wearable</span>
              </button>

              {/* Theme Toggle — single click quick-swaps light/dark, double click opens
                  the full Theme Studio panel for picking a specific theme. */}
              <button
                onClick={toggleLightDark}
                onDoubleClick={() => setIsThemeSwitcherOpen(true)}
                title="Click to toggle light/dark · Double-click for Theme Studio"
                className="rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/50 transition-all shrink-0 p-1.5 sm:p-2"
              >
                {isLightTheme ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>

              {/* Secondary explicit entry point to the full Theme Studio (Palette icon),
                  since double-click isn't discoverable. */}
              <button
                onClick={() => setIsThemeSwitcherOpen(true)}
                title="Theme Studio"
                className="hidden sm:flex p-1.5 sm:p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/50 transition-all shrink-0"
              >
                <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </>
          )}

          {/* User Profile Dropdown / Direct Avatar Link */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors border border-transparent hover:border-[var(--border-color)]"
            >
              <img
                src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default&mouth=smile,twinkle&eyes=happy,default'}
                alt={user?.name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-[var(--accent-primary)]/40 shrink-0"
              />
              {!isCompact && (
                <div className="hidden lg:block text-left text-xs">
                  <p className="font-semibold text-[var(--text-primary)] truncate max-w-[100px]">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-[var(--accent-primary)] font-medium capitalize truncate max-w-[100px]">{user?.currentGoal?.type?.replace('_', ' ') || 'Fitness Enthusiast'}</p>
                </div>
              )}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-semibold"
                >
                  <User className="w-4 h-4 text-[var(--accent-primary)]" /> User Profile & RPG Hub
                </button>

                {isCompact && (
                  <>
                    <button
                      onClick={() => { dispatch(setWearableModalOpen(true)); setShowProfileMenu(false); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-semibold"
                    >
                      <Watch className="w-4 h-4 text-[var(--accent-primary)]" /> Sync Wearable Data
                    </button>
                    <button
                      onClick={() => { toggleLightDark(); setShowProfileMenu(false); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-semibold"
                    >
                      {isLightTheme ? <Moon className="w-4 h-4 text-[var(--accent-primary)]" /> : <Sun className="w-4 h-4 text-[var(--accent-primary)]" />}
                      {isLightTheme ? 'Switch to Dark' : 'Switch to Light'}
                    </button>
                    <button
                      onClick={() => { setIsThemeSwitcherOpen(true); setShowProfileMenu(false); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-semibold"
                    >
                      <Palette className="w-4 h-4 text-[var(--accent-primary)]" /> Theme Studio
                    </button>
                  </>
                )}

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
      </div>
    </header>
  );
}
