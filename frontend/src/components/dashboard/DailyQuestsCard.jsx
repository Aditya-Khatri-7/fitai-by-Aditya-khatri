import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { completeQuest } from '../../redux/slices/gamificationSlice';
import { useTheme } from '../../context/ThemeContext';
import { Modal } from '../ui/Modal';
import { Zap, CheckCircle2, Award } from 'lucide-react';
import toast from 'react-hot-toast';

export function DailyQuestsCard() {
  const dispatch = useDispatch();
  const { level, xp, xpToNextLevel, rankTitle, dailyQuests, archetype } = useSelector(state => state.gamification);
  const { mobileMode, isNarrowViewport } = useTheme();
  const isCompact = mobileMode || isNarrowViewport;
  const [confirmQuest, setConfirmQuest] = useState(null);

  const handleClaim = (quest) => {
    if (!quest.completed) {
      dispatch(completeQuest(quest.id));
      toast.success(`Claimed +${quest.xp} XP for completing ${quest.title}! 🎉`);
    }
  };

  // On mobile, claiming opens a confirmation dialog (matching the Injury Manager
  // pattern) instead of instantly firing — desktop keeps the instant one-tap claim.
  const handleClaimClick = (quest) => {
    if (quest.completed) return;
    if (isCompact) setConfirmQuest(quest);
    else handleClaim(quest);
  };

  const handleConfirmClaim = () => {
    if (confirmQuest) {
      handleClaim(confirmQuest);
      setConfirmQuest(null);
    }
  };

  const xpPercent = Math.min(100, Math.round((xp / xpToNextLevel) * 100));
  const completedCount = dailyQuests.filter(q => q.completed).length;
  const incompleteQuests = dailyQuests.filter(q => !q.completed);
  const activeQuest = incompleteQuests[0] || null;

  return (
    <div className="p-4 sm:p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4 relative overflow-hidden">
      
      {/* Header Level & Quest HUD */}
      <div className={`flex ${mobileMode ? 'flex-col items-start' : 'flex-col sm:flex-row items-start sm:items-center'} justify-between gap-3 border-b border-[var(--border-color)] pb-3`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[var(--accent-primary)] to-emerald-400 text-slate-950 font-extrabold flex items-center justify-center shadow-lg text-base sm:text-lg shrink-0">
            {level}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-extrabold text-[var(--accent-primary)] uppercase tracking-wider whitespace-nowrap">
                {rankTitle}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[10px] text-[var(--text-secondary)] font-bold whitespace-nowrap">
                {archetype?.name || 'Strength Juggernaut'}
              </span>
            </div>
            <h3 className="text-base sm:text-xl font-extrabold text-[var(--text-primary)] truncate">Daily RPG Quests & Level Hub</h3>
          </div>
        </div>

        {/* XP Mini Bar */}
        <div className={`w-full ${mobileMode ? 'w-full' : 'sm:w-64'} space-y-1.5 shrink-0`}>
          <div className="flex justify-between text-[11px] font-extrabold">
            <span className="text-[var(--text-secondary)] flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> XP Progress
            </span>
            <span className="text-[var(--accent-primary)] font-mono">{xp} / {xpToNextLevel} XP</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden border border-[var(--border-color)]">
            <div
              className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quests — one active challenge shown at a time instead of a whole grid at
          once, so the dashboard doesn't read as cluttered with claim buttons.
          Claiming auto-advances to the next incomplete quest. */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-[var(--text-tertiary)] uppercase tracking-widest block">
            ACTIVE DAILY CHALLENGE
          </span>
          <span className="text-[10px] font-bold text-[var(--text-tertiary)] font-mono">{completedCount} / {dailyQuests.length} claimed</span>
        </div>

        {activeQuest ? (
          <div className="p-4 rounded-2xl border bg-[var(--bg-tertiary)] border-[var(--border-color)] space-y-3 animate-in fade-in duration-300">
            <div className="flex justify-between items-center gap-2">
              <span className="font-extrabold text-sm text-[var(--text-primary)]">{activeQuest.title}</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold text-[10px] shrink-0">
                +{activeQuest.xp} XP
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">{activeQuest.desc}</p>

            <button
              onClick={() => handleClaimClick(activeQuest)}
              className="w-full py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 shadow-md"
            >
              <Award className="w-4 h-4" /> Claim Reward
            </button>

            {dailyQuests.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {dailyQuests.map((q) => (
                  <span
                    key={q.id}
                    className={`h-1.5 rounded-full transition-all ${
                      q.completed ? 'w-4 bg-emerald-400' : q.id === activeQuest.id ? 'w-6 bg-[var(--accent-primary)]' : 'w-1.5 bg-[var(--border-color)]'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-2xl border bg-emerald-950/20 border-emerald-500/40 text-center space-y-2 animate-in fade-in duration-300">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="font-extrabold text-emerald-400 text-sm">🎉 Congrats! All rewards claimed.</p>
            <p className="text-xs text-[var(--text-secondary)]">Check back tomorrow for new daily challenges.</p>
          </div>
        )}
      </div>

      <Modal isOpen={!!confirmQuest} onClose={() => setConfirmQuest(null)} title="Claim Daily Reward" maxWidth="max-w-sm">
        {confirmQuest && (
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-extrabold text-[var(--text-primary)]">{confirmQuest.title}</h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{confirmQuest.desc}</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-extrabold text-sm inline-block">
              +{confirmQuest.xp} XP
            </div>
            <button
              onClick={handleConfirmClaim}
              className="w-full py-3 rounded-xl bg-[var(--accent-primary)] text-slate-950 font-extrabold text-sm shadow-lg flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4" /> Claim Reward
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
