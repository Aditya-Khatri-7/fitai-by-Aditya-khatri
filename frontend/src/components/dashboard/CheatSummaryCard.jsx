import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCheatStatus } from '../../redux/slices/cheatSlice';
import { PartyPopper, Utensils, ArrowRight } from 'lucide-react';

// Compact "beautiful" dashboard teaser for the XP-gated Cheat Center — full
// detail (redeem flows, history) lives on /cheat, reachable from Calendar & More.
export function CheatSummaryCard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector(state => state.cheat);

  useEffect(() => { dispatch(fetchCheatStatus()); }, [dispatch]);

  return (
    <button
      onClick={() => navigate('/cheat')}
      className="w-full text-left p-5 rounded-3xl bg-gradient-to-br from-purple-950/40 to-[var(--bg-secondary)] border border-purple-500/30 shadow-2xl flex items-center gap-4 hover:border-purple-500/60 transition-all group"
    >
      <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform">
        <PartyPopper className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-extrabold text-sm text-[var(--text-primary)]">Cheat Center</h4>
        <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 mt-0.5 flex-wrap">
          <Utensils className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          {status.canCheatMeal || status.canCheatDay
            ? `You've earned it — ${status.xp} XP available to spend on a cheat meal or day.`
            : `Keep it up — earn more XP to unlock a cheat meal or cheat day.`}
        </p>
      </div>
      <ArrowRight className="w-5 h-5 text-purple-400 shrink-0 group-hover:translate-x-1 transition-transform" />
    </button>
  );
}
