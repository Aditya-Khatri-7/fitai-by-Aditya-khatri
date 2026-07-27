import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearVictoryDrop } from '../../redux/slices/gamificationSlice';
import { Sparkles, Trophy, Flame, Award, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export function WorkoutVictoryModal({ onClose }) {
  const dispatch = useDispatch();
  const { lastVictoryDrop, level, rankTitle, xp, xpToNextLevel } = useSelector(state => state.gamification);

  if (!lastVictoryDrop) return null;

  const handleClose = () => {
    dispatch(clearVictoryDrop());
    if (onClose) onClose();
  };

  const xpPercent = Math.min(100, Math.round((xp / xpToNextLevel) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[var(--bg-secondary)] border-2 border-[var(--accent-primary)] shadow-[0_0_50px_rgba(59,130,246,0.3)] text-[var(--text-primary)] space-y-6 animate-in zoom-in-95 duration-300 relative overflow-hidden">
        
        {/* Ambient Glowing Background Effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[var(--accent-primary)]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        {/* Victory Header Banner */}
        <div className="text-center space-y-2 relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[var(--accent-primary)] to-emerald-400 text-slate-950 mx-auto flex items-center justify-center shadow-xl animate-bounce">
            <Trophy className="w-9 h-9 stroke-[2.5]" />
          </div>
          <span className="px-3 py-1 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] font-extrabold text-xs uppercase tracking-wider border border-[var(--border-color)]">
            VICTORY ACHIEVED! 🏆
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
            {lastVictoryDrop.title || 'Session Completed'}
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Awesome job! You destroyed today's adaptive AI workout plan.
          </p>
        </div>

        {/* XP & Rewards Drop Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-center space-y-1">
            <Zap className="w-5 h-5 text-amber-400 mx-auto" />
            <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase block">XP EARNED</span>
            <span className="text-lg font-extrabold text-amber-400">+{lastVictoryDrop.xpEarned || 350} XP</span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-center space-y-1">
            <Flame className="w-5 h-5 text-rose-500 mx-auto" />
            <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase block">MAX COMBO</span>
            <span className="text-lg font-extrabold text-rose-400">{lastVictoryDrop.maxCombo || 4}x Combo</span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-center space-y-1">
            <Award className="w-5 h-5 text-[var(--accent-primary)] mx-auto" />
            <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase block">VOLUME LIFTED</span>
            <span className="text-lg font-extrabold text-[var(--accent-primary)]">{lastVictoryDrop.totalVolume || 4200} kg</span>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-[var(--text-primary)] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" /> Level {level} • {rankTitle}
            </span>
            <span className="text-[var(--accent-primary)] font-mono">{xp} / {xpToNextLevel} XP</span>
          </div>
          <div className="w-full h-3 rounded-full bg-[var(--bg-secondary)] overflow-hidden p-0.5 border border-[var(--border-color)]">
            <div
              className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 rounded-full transition-all duration-700 shadow-md"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* Attribute Gains Banner */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
          <span className="font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> STAT BOOST UNLOCKED
          </span>
          <div className="flex gap-2 font-mono text-[10px] font-bold">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">+3 Strength</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">+2 Consistency</span>
          </div>
        </div>

        {/* Claim Loot Button */}
        <button
          onClick={handleClose}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 text-slate-950 font-extrabold text-sm shadow-2xl hover:opacity-90 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
        >
          <span>CLAIM LOOT & CONTINUE</span>
          <ArrowRight className="w-5 h-5 stroke-[3]" />
        </button>
      </div>
    </div>
  );
}
