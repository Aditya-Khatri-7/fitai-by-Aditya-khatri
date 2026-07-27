import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { completeQuest } from '../../redux/slices/gamificationSlice';
import { useTheme } from '../../context/ThemeContext';
import { Zap, CheckCircle2, Award } from 'lucide-react';
import toast from 'react-hot-toast';

export function DailyQuestsCard() {
  const dispatch = useDispatch();
  const { level, xp, xpToNextLevel, rankTitle, dailyQuests, archetype } = useSelector(state => state.gamification);
  const { mobileMode } = useTheme();

  const handleClaim = (quest) => {
    if (!quest.completed) {
      dispatch(completeQuest(quest.id));
      toast.success(`Claimed +${quest.xp} XP for completing ${quest.title}! 🎉`);
    }
  };

  const xpPercent = Math.min(100, Math.round((xp / xpToNextLevel) * 100));

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

      {/* Quests Grid */}
      <div className="space-y-2.5">
        <span className="text-[10px] font-extrabold text-[var(--text-tertiary)] uppercase tracking-widest block">
          ACTIVE DAILY CHALLENGES
        </span>

        <div className={`grid grid-cols-1 ${mobileMode ? 'grid-cols-1' : 'sm:grid-cols-2 md:grid-cols-3'} gap-3`}>
          {dailyQuests.map((quest) => (
            <div
              key={quest.id}
              className={`p-3.5 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                quest.completed
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/50'
              }`}
            >
              <div className="space-y-1">
                <div className="flex justify-between items-center gap-2">
                  <span className="font-extrabold text-xs text-[var(--text-primary)] truncate">{quest.title}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold text-[10px] shrink-0">
                    +{quest.xp} XP
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] font-medium leading-relaxed">{quest.desc}</p>
              </div>

              <button
                onClick={() => handleClaim(quest)}
                disabled={quest.completed}
                className={`w-full py-2 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  quest.completed
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                    : 'bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 shadow-md'
                }`}
              >
                {quest.completed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Claimed
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" /> Claim Reward
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
