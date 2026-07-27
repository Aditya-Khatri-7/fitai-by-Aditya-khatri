import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function NutritionCharts() {
  const data = [
    { day: 'Mon', calories: 2750, protein: 180 },
    { day: 'Tue', calories: 2890, protein: 195 },
    { day: 'Wed', calories: 2450, protein: 165 },
    { day: 'Thu', calories: 2800, protein: 185 },
    { day: 'Fri', calories: 2780, protein: 185 },
    { day: 'Sat', calories: 2900, protein: 190 },
    { day: 'Sun', calories: 2600, protein: 175 }
  ];

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">WEEKLY CALORIC INTAKE COMPLIANCE</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="day" stroke="var(--text-tertiary)" tick={{ fontSize: 11 }} />
            <YAxis stroke="var(--text-tertiary)" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-primary)' }} />
            <Bar dataKey="calories" fill="var(--accent-primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
