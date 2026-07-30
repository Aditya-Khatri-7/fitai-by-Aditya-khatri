import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWorkoutRange } from '../../redux/slices/workoutSlice';
import { Calendar } from 'lucide-react';

const RANGE_DAYS = 90;

export function WorkoutHeatmap() {
  const dispatch = useDispatch();
  const { workoutRange } = useSelector(state => state.workout);

  useEffect(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (RANGE_DAYS - 1));
    dispatch(fetchWorkoutRange({ from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] }));
  }, [dispatch]);

  const { cells, consistencyPct } = useMemo(() => {
    const byDate = new Map((workoutRange || []).map(w => [new Date(w.date).toDateString(), w]));
    const days = [];
    let loggedDays = 0;

    for (let i = RANGE_DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const workout = byDate.get(d.toDateString());
      // 0 = nothing logged, 1 = planned/in-progress, 2 = completed — real status-derived intensity
      const count = !workout ? 0 : workout.status === 'completed' ? 2 : 1;
      if (count > 0) loggedDays += 1;
      days.push({ date: d.toDateString(), count });
    }

    return { cells: days, consistencyPct: Math.round((loggedDays / RANGE_DAYS) * 100) };
  }, [workoutRange]);

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--accent-primary)]" /> {RANGE_DAYS}-DAY WORKOUT CONSISTENCY HEATMAP
        </h3>
        <span className="text-xs text-[var(--text-tertiary)] font-mono">{consistencyPct}% Consistency Rate</span>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto py-2">
        {cells.map((item, idx) => (
          <div
            key={idx}
            title={`${item.date}: ${item.count === 0 ? 'no workout' : item.count === 1 ? 'planned' : 'completed'}`}
            className={`w-3.5 h-3.5 rounded-sm transition-all ${
              item.count === 0
                ? 'bg-[var(--bg-tertiary)] border border-[var(--border-color)]'
                : item.count === 1
                ? 'bg-[var(--accent-glow)]'
                : 'bg-[var(--accent-primary)] shadow-sm'
            }`}
          ></div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 text-[10px] text-[var(--text-tertiary)]">
        <span>Less</span>
        <span className="w-3 h-3 rounded-sm bg-[var(--bg-tertiary)]"></span>
        <span className="w-3 h-3 rounded-sm bg-[var(--accent-glow)]"></span>
        <span className="w-3 h-3 rounded-sm bg-[var(--accent-primary)]"></span>
        <span>More</span>
      </div>
    </div>
  );
}
