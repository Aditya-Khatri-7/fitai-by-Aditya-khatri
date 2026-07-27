import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addXp } from '../../redux/slices/gamificationSlice';
import { Flame, ShieldCheck, Zap, Award, X, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export function StreakFlame() {
  const dispatch = useDispatch();
  const streak = useSelector(state => state.auth.user?.streak?.current ?? 0);
  const [isOpen, setIsOpen] = useState(false);
  const [claimedToday, setClaimedToday] = useState(false);

  const handleClaimStreakXP = () => {
    if (!claimedToday) {
      dispatch(addXp(50));
      setClaimedToday(true);
      toast.success('🔥 +50 XP Claimed for Daily Streak!');
    }
  };

  return (
    <>
      {/* TopNav Badge Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400 font-extrabold text-xs shadow-md hover:scale-105 transition-all cursor-pointer group"
        title="View Gamified Streak Status"
      >
        <Flame className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse group-hover:scale-110 transition-transform" />
        <span className="font-mono">{streak} DAYS</span>
        <span className="hidden sm:inline text-[10px] px-1.5 py-0.2 bg-amber-500/30 text-amber-300 rounded font-bold uppercase">
          WARRIOR
        </span>
      </button>

      {/* Streak Details Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-5 relative">
            
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Streak Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-xl shrink-0">
                <Flame className="w-10 h-10 fill-current animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-extrabold uppercase">
                    ACTIVE STREAK
                  </span>
                  <span className="text-xs text-[var(--text-secondary)] font-bold">Tier 3 Warrior</span>
                </div>
                <h3 className="text-2xl font-black text-[var(--text-primary)] mt-0.5">{streak}-DAY STREAK FLAME</h3>
              </div>
            </div>

            {/* Streak Shield & Stats Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
                <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Streak Freeze Shield
                </span>
                <p className="font-extrabold text-emerald-400">1 Shield Active</p>
                <span className="text-[10px] text-[var(--text-secondary)]">Protects streak if 1 day missed</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1">
                <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Streak Multiplier
                </span>
                <p className="font-extrabold text-amber-400">+15% XP Bonus</p>
                <span className="text-[10px] text-[var(--text-secondary)]">Applied to all workout loot</span>
              </div>
            </div>

            {/* Daily Streak Reward Button */}
            <div className="p-4 rounded-2xl bg-[var(--accent-glow)] border border-[var(--accent-primary)]/40 space-y-3 text-center">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[var(--accent-primary)] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Daily Streak Reward
                </span>
                <span className="font-mono text-amber-400 font-bold">+50 XP</span>
              </div>

              <button
                onClick={handleClaimStreakXP}
                disabled={claimedToday}
                className={`w-full py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
                  claimedToday
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                    : 'bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 shadow-lg transform hover:scale-[1.01]'
                }`}
              >
                {claimedToday ? (
                  <>
                    <Award className="w-4 h-4" /> Claimed Today 🎉
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 fill-current" /> Claim Daily +50 XP Bonus
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
