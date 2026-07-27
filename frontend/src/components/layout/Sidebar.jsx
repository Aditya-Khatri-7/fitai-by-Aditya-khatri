import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard,
  Dumbbell,
  Apple,
  HeartPulse,
  Bot,
  BarChart3,
  Calendar,
  Stethoscope,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Flame,
  Smartphone,
  Monitor,
  Eye,
  EyeOff,
  Power,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export function Sidebar() {
  const dispatch = useDispatch();
  const { isSidebarOpen } = useSelector(state => state.ui);
  const {
    mobileMode,
    toggleMobileMode,
    isBotEnabled,
    toggleBotEnabled,
    mouseTrackingEnabled,
    toggleMouseTracking,
    isNarrowViewport
  } = useTheme();
  // Real narrow viewports get the same slide-over drawer behavior as the manual
  // mobileMode preview, without the 390px frame simulation styling.
  const isDrawerLayout = mobileMode || isNarrowViewport;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/workouts', label: 'Workouts', icon: Dumbbell },
    { path: '/nutrition', label: 'Nutrition', icon: Apple },
    { path: '/health', label: 'Health & Wearables', icon: HeartPulse },
    { path: '/health-update', label: 'Health Status Update', icon: Stethoscope, badge: 'NEW' },
    { path: '/ai-coach', label: '3D AI Studio', icon: Bot, badge: 'AI' },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/calendar', label: 'Smart Calendar', icon: Calendar },
    { path: '/profile', label: 'Profile', icon: UserCircle }
  ];

  const handleBotToggle = () => {
    toggleBotEnabled();
    toast.success(`AI Companion Bot ${!isBotEnabled ? 'Activated 🤖' : 'Turned Off ⚡'}`);
  };

  const handleTrackingToggle = () => {
    toggleMouseTracking();
    toast.success(`3D Eye Tracking ${!mouseTrackingEnabled ? 'Enabled 👁️' : 'Disabled 🙈'}`);
  };

  // In drawer layout (manual mobileMode preview OR a real narrow viewport), the
  // sidebar behaves as a slide-over overlay rather than pushing page content.
  const sidebarWidthClass = isDrawerLayout
    ? isSidebarOpen
      ? 'w-64 translate-x-0 shadow-2xl z-50'
      : 'w-64 -translate-x-full z-50'
    : isSidebarOpen
      ? 'w-64'
      : 'w-20';

  return (
    <>
      {/* Backdrop overlay for drawer mode */}
      {isDrawerLayout && isSidebarOpen && (
        <div
          onClick={() => dispatch(toggleSidebar())}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] transition-all duration-300 flex flex-col justify-between ${sidebarWidthClass}`}
      >
        <div>
          {/* Header Logo & Collapse Toggle */}
          <div className="flex items-center justify-between h-16 px-3 border-b border-[var(--border-color)] relative">
            <div className={`flex items-center gap-3 overflow-hidden ${!isSidebarOpen && !isDrawerLayout ? 'w-full justify-center' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-glow)] flex items-center justify-center text-[var(--accent-primary)] font-black shadow-lg shrink-0 border border-[var(--accent-primary)]/30">
                <Flame className="w-6 h-6 fill-current text-[var(--accent-primary)]" />
              </div>
              {(isSidebarOpen || isDrawerLayout) && (
                <span className="text-xl font-extrabold tracking-tight text-white drop-shadow-sm whitespace-nowrap">
                  Fit<span className="text-[var(--accent-primary)]">AI</span>
                </span>
              )}
            </div>

            <button
              onClick={() => dispatch(toggleSidebar())}
              className={`p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[var(--bg-tertiary)] transition-colors ${
                !isSidebarOpen && !isDrawerLayout ? 'absolute -right-3 top-5 bg-[var(--sidebar-bg)] border border-[var(--border-color)] shadow-md rounded-full text-[var(--accent-primary)]' : ''
              }`}
              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {isDrawerLayout ? <X className="w-5 h-5" /> : isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation items */}
          <nav className="p-3 space-y-1.5 mt-2 overflow-y-auto max-h-[calc(100vh-280px)] scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (isDrawerLayout && isSidebarOpen) dispatch(toggleSidebar());
                  }}
                  title={!isSidebarOpen && !isDrawerLayout ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${!isSidebarOpen && !isDrawerLayout ? 'justify-center px-0' : 'px-3.5'} py-3 rounded-xl transition-all font-semibold text-sm ${
                      isActive
                        ? 'bg-[var(--nav-active-bg)] text-white border border-[var(--accent-primary)]/40 shadow-md font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-[var(--bg-tertiary)]/40'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {(isSidebarOpen || isDrawerLayout) && <span className="truncate">{item.label}</span>}
                  {(isSidebarOpen || isDrawerLayout) && item.badge && (
                    <span className="ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Viewport & AI Companion Controls */}
        <div className="p-3 border-t border-[var(--border-color)] space-y-2">
          
          {/* Master Bot Turn Off/On Toggle */}
          <button
            onClick={handleBotToggle}
            title={isBotEnabled ? "Turn OFF AI Companion Bot" : "Turn ON AI Companion Bot"}
            className={`w-full flex items-center ${!isSidebarOpen && !isDrawerLayout ? 'justify-center px-0' : 'px-3'} py-2 rounded-xl border text-xs font-extrabold transition-all shadow-sm ${
              isBotEnabled
                ? 'bg-[var(--accent-glow)] text-[var(--accent-primary)] border-[var(--accent-primary)]/40 hover:bg-[var(--accent-primary)] hover:text-slate-950'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
            }`}
          >
            <Power className="w-4 h-4 shrink-0" />
            {(isSidebarOpen || isDrawerLayout) && (
              <div className="flex items-center justify-between w-full">
                <span>AI Bot System</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 font-mono">
                  {isBotEnabled ? 'ACTIVE' : 'OFF'}
                </span>
              </div>
            )}
          </button>

          {/* 3D Eye Tracking Toggle */}
          <button
            onClick={handleTrackingToggle}
            title={mouseTrackingEnabled ? "Disable 3D Bot Eye Tracking" : "Enable 3D Bot Eye Tracking"}
            className={`w-full flex items-center ${!isSidebarOpen && !isDrawerLayout ? 'justify-center px-0' : 'px-3'} py-2 rounded-xl border text-xs font-extrabold transition-all shadow-sm ${
              mouseTrackingEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-[var(--bg-tertiary)] text-slate-400 border-[var(--border-color)] hover:text-white'
            }`}
          >
            {mouseTrackingEnabled ? <Eye className="w-4 h-4 text-emerald-400 shrink-0" /> : <EyeOff className="w-4 h-4 text-slate-400 shrink-0" />}
            {(isSidebarOpen || isDrawerLayout) && (
              <div className="flex items-center justify-between w-full">
                <span>3D Eye Tracking</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 font-mono">
                  {mouseTrackingEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
            )}
          </button>

          {/* Viewport Switcher */}
          <button
            onClick={toggleMobileMode}
            title={mobileMode ? "Switch to Desktop View" : "Switch to Mobile View"}
            className={`w-full flex items-center ${!isSidebarOpen && !isDrawerLayout ? 'justify-center px-0' : 'px-3'} py-2 rounded-xl border text-xs font-extrabold transition-all shadow-sm ${
              mobileMode
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-[var(--bg-tertiary)] text-slate-200 border-[var(--border-color)] hover:border-[var(--accent-primary)]/50'
            }`}
          >
            {mobileMode ? <Smartphone className="w-4 h-4 text-amber-400 shrink-0" /> : <Monitor className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />}
            {(isSidebarOpen || isDrawerLayout) && (
              <div className="flex items-center justify-between w-full">
                <span>{mobileMode ? 'Mobile View' : 'Desktop View'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-[var(--accent-primary)] border border-[var(--border-color)] font-mono">
                  {mobileMode ? '390px' : 'Full'}
                </span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
