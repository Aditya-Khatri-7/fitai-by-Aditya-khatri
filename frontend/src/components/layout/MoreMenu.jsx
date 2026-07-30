import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { useTheme } from '../../context/ThemeContext';
import {
  X, HeartPulse, Stethoscope, Bot, BarChart3, Calendar, UserCircle,
  Power, Eye, EyeOff, Sun, Moon, Palette, LogOut, Mic, UserRound, User, PartyPopper
} from 'lucide-react';
import toast from 'react-hot-toast';

export const MORE_LINKS = [
  { path: '/health', label: 'Health & Wearables', icon: HeartPulse },
  { path: '/health-update', label: 'Health Status Update', icon: Stethoscope, badge: 'NEW' },
  { path: '/ai-coach', label: '3D AI Studio', icon: Bot, badge: 'AI' },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/calendar', label: 'Smart Calendar', icon: Calendar },
  { path: '/cheat', label: 'Cheat Center', icon: PartyPopper, badge: '🎉' },
  { path: '/profile', label: 'Profile', icon: UserCircle }
];

export function MoreMenu({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const {
    isBotEnabled, toggleBotEnabled,
    mouseTrackingEnabled, toggleMouseTracking,
    isLightTheme, toggleLightDark,
    setIsThemeSwitcherOpen,
    voiceStyle, cycleVoiceStyle,
    voiceGender, toggleVoiceGender
  } = useTheme();

  const VOICE_STYLE_LABELS = { default: 'Default', soft: 'Soft', motivating: 'Motivating' };

  if (!isOpen) return null;

  const handleLogout = () => {
    dispatch(logout());
    onClose();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div onClick={onClose} className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />

      <div className="relative bg-[var(--bg-secondary)] border-t border-[var(--border-color)] rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <div className="sticky top-0 bg-[var(--bg-secondary)] flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <span className="text-sm font-extrabold text-[var(--text-primary)]">{user?.name || 'More'}</span>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 space-y-1">
          {MORE_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all ${
                    isActive
                      ? 'bg-[var(--nav-active-bg)] text-[var(--text-primary)] border border-[var(--accent-primary)]/40'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/60'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        <div className="p-3 pt-1 space-y-2 border-t border-[var(--border-color)]">
          <button
            onClick={() => { toggleBotEnabled(); toast.success(`AI Companion Bot ${!isBotEnabled ? 'Activated' : 'Turned Off'}`); }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm border transition-all ${
              isBotEnabled ? 'bg-[var(--accent-glow)] text-[var(--accent-primary)] border-[var(--accent-primary)]/40' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            <Power className="w-5 h-5 shrink-0" />
            <span className="flex-1 text-left">AI Companion Bot</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900">{isBotEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => { toggleMouseTracking(); toast.success(`3D Eye Tracking ${!mouseTrackingEnabled ? 'Enabled' : 'Disabled'}`); }}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-all"
          >
            {mouseTrackingEnabled ? <Eye className="w-5 h-5 text-emerald-400 shrink-0" /> : <EyeOff className="w-5 h-5 text-slate-400 shrink-0" />}
            <span className="flex-1 text-left">3D Eye Tracking</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900">{mouseTrackingEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => { cycleVoiceStyle(); toast.success(`Voice Style: ${VOICE_STYLE_LABELS[voiceStyle === 'default' ? 'soft' : voiceStyle === 'soft' ? 'motivating' : 'default']}`); }}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-all"
          >
            <Mic className="w-5 h-5 text-[var(--accent-primary)] shrink-0" />
            <span className="flex-1 text-left">Voice Style</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900">{VOICE_STYLE_LABELS[voiceStyle]}</span>
          </button>

          <button
            onClick={() => { toggleVoiceGender(); toast.success(`Voice set to ${voiceGender === 'female' ? 'Male' : 'Female'}`); }}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-all"
          >
            {voiceGender === 'female' ? <UserRound className="w-5 h-5 text-[var(--accent-primary)] shrink-0" /> : <User className="w-5 h-5 text-[var(--accent-primary)] shrink-0" />}
            <span className="flex-1 text-left">Voice Gender</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900">{voiceGender === 'female' ? 'Female' : 'Male'}</span>
          </button>

          <button
            onClick={toggleLightDark}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-all"
          >
            {isLightTheme ? <Moon className="w-5 h-5 text-[var(--accent-primary)] shrink-0" /> : <Sun className="w-5 h-5 text-[var(--accent-primary)] shrink-0" />}
            <span className="flex-1 text-left">{isLightTheme ? 'Switch to Dark' : 'Switch to Light'}</span>
          </button>

          <button
            onClick={() => { setIsThemeSwitcherOpen(true); onClose(); }}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-all"
          >
            <Palette className="w-5 h-5 text-[var(--accent-primary)] shrink-0" />
            <span className="flex-1 text-left">Theme Studio</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm border border-rose-500/30 bg-rose-500/10 text-rose-400 transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="flex-1 text-left">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
