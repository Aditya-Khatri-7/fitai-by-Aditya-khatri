import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export function MuscleRadarChart() {
  const data = [
    { subject: 'Chest', A: 120, fullMark: 150 },
    { subject: 'Back', A: 98, fullMark: 150 },
    { subject: 'Legs', A: 86, fullMark: 150 },
    { subject: 'Shoulders', A: 110, fullMark: 150 },
    { subject: 'Arms', A: 130, fullMark: 150 },
    { subject: 'Core', A: 95, fullMark: 150 }
  ];

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl space-y-4">
      <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">MUSCLE GROUP BALANCE RADAR</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="var(--border-color)" />
            <PolarAngleAxis dataKey="subject" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="var(--border-color)" />
            <Radar name="Volume" dataKey="A" stroke="var(--accent-primary)" fill="var(--accent-primary)" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
