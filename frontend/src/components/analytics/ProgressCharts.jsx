import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function ProgressCharts() {
  const data = [
    { day: 'Mon', weight: 79.5, recovery: 72 },
    { day: 'Tue', weight: 79.4, recovery: 68 },
    { day: 'Wed', weight: 79.2, recovery: 84 },
    { day: 'Thu', weight: 79.0, recovery: 65 },
    { day: 'Fri', weight: 78.8, recovery: 78 },
    { day: 'Sat', weight: 78.9, recovery: 88 },
    { day: 'Sun', weight: 78.7, recovery: 92 }
  ];

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">BODY WEIGHT & RECOVERY TREND (7 DAYS)</h3>
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
            <Area type="monotone" dataKey="recovery" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorRec)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
