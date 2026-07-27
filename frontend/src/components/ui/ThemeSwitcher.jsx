import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { X, Palette, Check, Smartphone, Sparkles } from 'lucide-react';

const darkThemes = [
  { id: 'midnight_carbon', name: 'Midnight Carbon', bg1: '#0A0E1A', bg2: '#111827', accent: '#00D4FF' },
  { id: 'obsidian_blood', name: 'Obsidian Blood', bg1: '#080808', bg2: '#130E0E', accent: '#FF3D3D' },
  { id: 'void_purple', name: 'Void Purple', bg1: '#09060F', bg2: '#120D1F', accent: '#A855F7' },
  { id: 'forest_deep', name: 'Forest Deep', bg1: '#060C08', bg2: '#0D1A0F', accent: '#22C55E' },
  { id: 'ocean_abyss', name: 'Ocean Abyss', bg1: '#040D12', bg2: '#0A1A22', accent: '#06B6D4' },
  { id: 'burnt_circuit', name: 'Burnt Circuit', bg1: '#0C0800', bg2: '#1A1200', accent: '#F59E0B' },
  { id: 'neon_noir', name: 'Neon Noir', bg1: '#070008', bg2: '#100012', accent: '#FF00CC' },
];

const lightThemes = [
  { id: 'clinical_white', name: 'Clinical White', bg1: '#F8F9FA', bg2: '#FFFFFF', accent: '#BAFF29' },
  { id: 'arctic_white', name: 'Arctic White', bg1: '#F0F7FF', bg2: '#FFFFFF', accent: '#0066CC' },
  { id: 'sand_dune', name: 'Sand Dune', bg1: '#FAF6F0', bg2: '#FFFFFF', accent: '#C2440E' },
  { id: 'blossom', name: 'Blossom', bg1: '#FFF5F8', bg2: '#FFFFFF', accent: '#E91E8C' },
  { id: 'sage_light', name: 'Sage Light', bg1: '#F4F8F4', bg2: '#FFFFFF', accent: '#166534' },
  { id: 'golden_hour', name: 'Golden Hour', bg1: '#FFFBF0', bg2: '#FFFFFF', accent: '#D97706' },
  { id: 'lavender_dream', name: 'Lavender Dream', bg1: '#F8F5FF', bg2: '#FFFFFF', accent: '#7C3AED' },
];

const moodButtons = [
  { mood: 'focused', emoji: '😤', label: 'Focused', themeId: 'clinical_white' },
  { mood: 'calm', emoji: '😌', label: 'Calm', themeId: 'arctic_white' },
  { mood: 'energized', emoji: '💪', label: 'Energized', themeId: 'obsidian_blood' },
  { mood: 'natural', emoji: '🌿', label: 'Natural', themeId: 'forest_deep' },
  { mood: 'cool', emoji: '🌊', label: 'Cool', themeId: 'ocean_abyss' },
  { mood: 'intense', emoji: '🔥', label: 'Intense', themeId: 'burnt_circuit' },
  { mood: 'creative', emoji: '💜', label: 'Creative', themeId: 'void_purple' },
];

export function ThemeSwitcher() {
  const { theme, setTheme, mobileMode, toggleMobileMode, isThemeSwitcherOpen, setIsThemeSwitcherOpen } = useTheme();

  return (
    <AnimatePresence>
      {isThemeSwitcherOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsThemeSwitcherOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative z-10 w-full max-w-md h-full bg-[var(--bg-secondary)] border-l border-[var(--border-color)] shadow-2xl flex flex-col text-[var(--text-primary)]"
          >
            {/* Header */}
            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent-glow)] flex items-center justify-center text-[var(--accent-primary)]">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base tracking-wide flex items-center gap-2">
                    THEME STUDIO
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">Customize active environment styling</p>
                </div>
              </div>
              <button
                onClick={() => setIsThemeSwitcherOpen(false)}
                className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Mood Selector */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Mood Selector
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">How are you feeling today?</p>
                <div className="flex flex-wrap gap-2">
                  {moodButtons.map((m) => (
                    <button
                      key={m.mood}
                      onClick={() => setTheme(m.themeId)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                        theme === m.themeId
                          ? 'bg-[var(--accent-primary)] text-slate-950 border-transparent shadow-lg font-bold'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-[var(--border-color)] hover:border-[var(--accent-primary)]'
                      }`}
                    >
                      <span>{m.emoji}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dark Themes */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-2">
                  Dark Themes (7)
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {darkThemes.map((item) => {
                    const isActive = theme === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setTheme(item.id)}
                        className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-20 ${
                          isActive
                            ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/40'
                            : 'border-[var(--border-color)] hover:border-[var(--accent-primary)]/60'
                        }`}
                        style={{ background: item.bg2 }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: item.accent }}
                            />
                            <span
                              className="w-3 h-3 rounded-full opacity-60"
                              style={{ backgroundColor: item.bg1 }}
                            />
                          </div>
                          {isActive && (
                            <span className="w-5 h-5 rounded-full bg-[var(--accent-primary)] text-slate-950 flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-slate-100 truncate mt-2">
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Light Themes */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-2">
                  Light Themes (7)
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {lightThemes.map((item) => {
                    const isActive = theme === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setTheme(item.id)}
                        className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-20 ${
                          isActive
                            ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/40 shadow-md'
                            : 'border-[var(--border-color)] hover:border-[var(--accent-primary)]/60'
                        }`}
                        style={{ background: item.bg2 }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-sm"
                              style={{ backgroundColor: item.accent }}
                            />
                            <span
                              className="w-3 h-3 rounded-full opacity-60"
                              style={{ backgroundColor: item.bg1 }}
                            />
                          </div>
                          {isActive && (
                            <span className="w-5 h-5 rounded-full bg-[var(--accent-primary)] text-slate-950 flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-slate-900 truncate mt-2">
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Display Mode */}
              <div className="space-y-3 border-t border-[var(--border-color)] pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Display Mode
                </h3>
                <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[var(--accent-glow)] text-[var(--accent-primary)] flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Mobile Viewport</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">Constrain width to 390px frame</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleMobileMode}
                    className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                      mobileMode ? 'bg-[var(--accent-primary)]' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                        mobileMode ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
