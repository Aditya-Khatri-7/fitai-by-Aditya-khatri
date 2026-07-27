import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Calendar as CalendarIcon, CheckCircle2, Clock, MinusCircle, XCircle } from 'lucide-react';
import { fetchWorkoutRange } from '../../redux/slices/workoutSlice';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(d) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekRange() {
  const now = new Date();
  const monday = new Date(now);
  const dayOffset = (now.getDay() + 6) % 7; // days since Monday
  monday.setDate(now.getDate() - dayOffset);
  monday.setHours(0, 0, 0, 0);
  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d);
  }
  return week;
}

export function WorkoutCalendarStrip() {
  const dispatch = useDispatch();
  const { workoutRange } = useSelector(state => state.workout);
  const week = useMemo(() => getWeekRange(), []);
  const todayKey = toDateKey(new Date());

  useEffect(() => {
    const from = toDateKey(week[0]);
    const to = toDateKey(week[6]);
    dispatch(fetchWorkoutRange({ from, to }));
  }, [dispatch]);

  const rangeLabel = `${week[0].toLocaleDateString([], { month: 'long', day: 'numeric' })} – ${week[6].toLocaleDateString([], { day: 'numeric' })}`;

  const days = week.map((d) => {
    const key = toDateKey(d);
    const workout = workoutRange.find(w => toDateKey(new Date(w.date)) === key);
    const isToday = key === todayKey;
    return {
      day: DAY_LABELS[d.getDay()],
      date: d.getDate(),
      isToday,
      status: workout ? workout.status : null,
      type: workout ? (workout.splitFocus || workout.title) : (isToday ? 'No workout yet' : 'Not planned')
    };
  });

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-[var(--accent-primary)]" /> WEEKLY WORKOUT SCHEDULE
        </h3>
        <span className="text-[11px] text-[var(--text-secondary)] font-medium">{rangeLabel}</span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((item, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl border text-center flex flex-col items-center justify-between space-y-1.5 transition-all ${
              item.isToday
                ? 'bg-[var(--accent-glow)] border-[var(--accent-primary)] shadow-lg ring-1 ring-[var(--accent-primary)]'
                : item.status === 'completed'
                ? 'bg-[var(--bg-tertiary)] border-[var(--border-color)]'
                : 'bg-[var(--bg-tertiary)]/50 border-[var(--border-color)] opacity-80'
            }`}
          >
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">{item.day}</span>
            <span className="text-sm font-extrabold text-[var(--text-primary)]">{item.date}</span>

            {item.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-[var(--accent-primary)]" />}
            {item.status === 'skipped' && <XCircle className="w-4 h-4 text-rose-400" />}
            {item.status === 'planned' && !item.isToday && <MinusCircle className="w-4 h-4 text-[var(--text-tertiary)]" />}
            {item.isToday && <Clock className="w-4 h-4 text-[var(--accent-primary)] animate-pulse" />}
            {!item.status && !item.isToday && <span className="text-[9px] font-semibold text-[var(--text-tertiary)]">--</span>}

            <span className="text-[9px] text-[var(--text-secondary)] truncate w-full font-medium">{item.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
