import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCheatStatus, redeemCheat } from '../../redux/slices/cheatSlice';
import { fetchGamificationState } from '../../redux/slices/gamificationSlice';
import { Utensils, PartyPopper, Zap, History, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const MEAL_SLOTS = ['breakfast', 'lunch', 'snack', 'dinner'];

// XP-gated ad-hoc cheat system: earn XP through consistency, spend it to cheat
// a single meal (e.g. stuck traveling, grabbing fast food for dinner) or a full
// day, capped per rolling week so it can't be abused. Separate from the free
// recurring weekly cheat day already configurable in Dietary Preferences.
export function CheatCenter() {
  const dispatch = useDispatch();
  const status = useSelector(state => state.cheat);
  const [selectedMeal, setSelectedMeal] = useState('dinner');

  useEffect(() => { dispatch(fetchCheatStatus()); }, [dispatch]);

  const mealLockedReason = status.xp < status.mealCost
    ? `Need ${status.mealCost - status.xp} more XP`
    : status.mealsUsedThisWeek >= status.maxMealsPerWeek
    ? 'Weekly limit reached'
    : null;

  const dayLockedReason = status.xp < status.dayCost
    ? `Need ${status.dayCost - status.xp} more XP`
    : status.daysUsedThisWeek >= status.maxDaysPerWeek
    ? 'Weekly limit reached'
    : null;

  const handleRedeemMeal = async () => {
    const result = await dispatch(redeemCheat({ type: 'meal', mealSlot: selectedMeal }));
    if (redeemCheat.fulfilled.match(result)) {
      toast.success(`🍔 Cheat meal approved for ${selectedMeal}! Enjoy — you earned it.`);
      // The cheat endpoint spends XP directly on the User doc — refetch the
      // gamification slice too so the XP shown on Dashboard/TopNav elsewhere
      // in the app doesn't look stale after spending it here.
      dispatch(fetchGamificationState());
    } else {
      toast.error(result.payload || 'Cannot redeem cheat meal right now');
    }
  };

  const handleRedeemDay = async () => {
    const result = await dispatch(redeemCheat({ type: 'day' }));
    if (redeemCheat.fulfilled.match(result)) {
      toast.success("🎉 Cheat day activated! Today's workout & meal plan are flagged as a free pass.");
      dispatch(fetchGamificationState());
    } else {
      toast.error(result.payload || 'Cannot redeem cheat day right now');
    }
  };

  return (
    <div className="space-y-5">
      {/* XP Summary */}
      <div className="p-4 rounded-2xl bg-[var(--accent-glow)] border border-[var(--accent-primary)]/30 flex items-center justify-between">
        <span className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-400" /> Available XP to Spend
        </span>
        <span className="text-lg font-extrabold text-[var(--accent-primary)] font-mono">{status.xp} XP</span>
      </div>

      {/* Cheat Meal */}
      <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Utensils className="w-4 h-4 text-[var(--accent-primary)]" /> Cheat Meal
          </span>
          <span className="text-[10px] font-bold text-amber-400 font-mono shrink-0">{status.mealCost} XP</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Traveling, or grabbing fast food for one meal? Redeem a single slot today — no macro guilt, no plan change needed.
        </p>
        <select
          value={selectedMeal}
          onChange={(e) => setSelectedMeal(e.target.value)}
          className="w-full p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
        >
          {MEAL_SLOTS.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
        <button
          onClick={handleRedeemMeal}
          disabled={!status.canCheatMeal || status.redeeming}
          className={`w-full py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
            status.canCheatMeal
              ? 'bg-[var(--accent-primary)] text-slate-950 hover:opacity-90 shadow-md'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] border border-[var(--border-color)] cursor-not-allowed'
          }`}
        >
          {status.canCheatMeal ? (
            <>Redeem Cheat Meal (-{status.mealCost} XP)</>
          ) : (
            <><Lock className="w-3.5 h-3.5" /> {mealLockedReason}</>
          )}
        </button>
        <p className="text-[10px] text-[var(--text-tertiary)] text-center font-semibold">
          {status.mealsUsedThisWeek} / {status.maxMealsPerWeek} used this week
        </p>
      </div>

      {/* Cheat Day */}
      <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <PartyPopper className="w-4 h-4 text-purple-400" /> Cheat Day
          </span>
          <span className="text-[10px] font-bold text-amber-400 font-mono shrink-0">{status.dayCost} XP</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Flags today's workout and meal plan as a full free pass — separate from your scheduled weekly cheat day (Nutrition → Dietary Preferences).
        </p>
        <button
          onClick={handleRedeemDay}
          disabled={!status.canCheatDay || status.redeeming}
          className={`w-full py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
            status.canCheatDay
              ? 'bg-gradient-to-r from-purple-500 to-[var(--accent-primary)] text-slate-950 hover:opacity-90 shadow-md'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] border border-[var(--border-color)] cursor-not-allowed'
          }`}
        >
          {status.canCheatDay ? (
            <>Redeem Cheat Day (-{status.dayCost} XP)</>
          ) : (
            <><Lock className="w-3.5 h-3.5" /> {dayLockedReason}</>
          )}
        </button>
        <p className="text-[10px] text-[var(--text-tertiary)] text-center font-semibold">
          {status.daysUsedThisWeek} / {status.maxDaysPerWeek} used this week
        </p>
      </div>

      {/* Recent History */}
      {status.recentRedemptions?.length > 0 && (
        <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-2">
          <span className="text-[10px] font-extrabold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" /> Recent Redemptions
          </span>
          <div className="space-y-1.5 text-xs">
            {status.recentRedemptions.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-secondary)]">
                  {r.type === 'meal' ? `Cheat Meal (${r.mealSlot})` : 'Cheat Day'} — {new Date(r.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
                <span className="font-mono font-bold text-rose-400">-{r.xpSpent} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
