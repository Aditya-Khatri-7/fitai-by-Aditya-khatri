import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
      dateKey: key,
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

      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <div className="grid grid-cols-7 gap-1.5 min-w-[320px]">
          {days.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => navigate(`/workouts?date=${item.dateKey}`)}
              title={`${item.type} — click to view/edit`}
              className={`p-2 sm:p-3 rounded-xl border text-center flex flex-col items-center justify-between space-y-1 sm:space-y-1.5 transition-all min-w-0 cursor-pointer hover:border-[var(--accent-primary)] hover:scale-[1.03] ${
                item.isToday
                  ? 'bg-[var(--accent-glow)] border-[var(--accent-primary)] shadow-lg ring-1 ring-[var(--accent-primary)]'
                  : item.status === 'completed'
                  ? 'bg-[var(--bg-tertiary)] border-emerald-500/40'
                  : 'bg-[var(--bg-tertiary)] border-[var(--border-color)]'
              }`}
            >
              <span className="text-[9px] sm:text-[10px] font-bold text-[var(--text-secondary)] uppercase">{item.day}</span>
              <span className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)]">{item.date}</span>

              {/* Exactly one status indicator per cell — today used to show both
                  a checkmark (completed) and a pulsing clock (today) stacked at
                  once, which threw off row alignment against the other 6 cells
                  that only ever render one line here. */}
              {item.status === 'completed' ? (
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--accent-primary)]" />
              ) : item.status === 'skipped' ? (
                <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-rose-400" />
              ) : item.isToday ? (
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--accent-primary)] animate-pulse" />
              ) : item.status === 'planned' ? (
                <MinusCircle className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--text-tertiary)]" />
              ) : (
                <span className="text-[8px] font-semibold text-[var(--text-tertiary)]">--</span>
              )}

              <span className="text-[8px] sm:text-[9px] text-[var(--text-secondary)] truncate w-full font-medium">{item.type}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
