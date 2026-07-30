import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchHealthMetricRange } from '../../redux/slices/healthSlice';
import { calculateRecoveryScore } from '../../utils/recoveryCalculator';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ProgressCharts() {
  const dispatch = useDispatch();
  const { metricsRange } = useSelector(state => state.health);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 6);
    dispatch(fetchHealthMetricRange({ from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] }));
  }, [dispatch]);

  const { data, hasData } = useMemo(() => {
    // Latest metric per calendar day, so multiple syncs in one day collapse to one point.
    const latestByDay = new Map();
    for (const metric of metricsRange || []) {
      latestByDay.set(new Date(metric.date).toDateString(), metric);
    }

    let any = false;
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const metric = latestByDay.get(d.toDateString());
      if (metric) any = true;
      const recovery = metric ? calculateRecoveryScore(metric, user) : null;
      days.push({
        day: DAY_LABELS[d.getDay()],
        weight: metric?.weight ?? null,
        recovery: recovery && !recovery.isUncalibrated ? recovery.score : null
      });
    }
    return { data: days, hasData: any };
  }, [metricsRange, user]);

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">BODY WEIGHT & RECOVERY TREND (7 DAYS)</h3>
      {hasData ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="day" stroke="var(--text-tertiary)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--text-tertiary)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-primary)' }} />
              <Area type="monotone" dataKey="recovery" connectNulls stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorRec)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-xs text-[var(--text-secondary)] text-center px-6">
          No wearable data synced in the last 7 days yet — sync your wearable to see your recovery trend here.
        </div>
      )}
    </div>
  );
}
