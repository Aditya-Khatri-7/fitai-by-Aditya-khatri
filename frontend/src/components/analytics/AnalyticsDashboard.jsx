import React from 'react';
import { WorkoutHeatmap } from './WorkoutHeatmap';
import { MuscleRadarChart } from './MuscleRadarChart';
import { ProgressCharts } from './ProgressCharts';
import { NutritionCharts } from './NutritionCharts';

export function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl">
        <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Performance & Analytics Studio</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Deep metrics breakdown, muscle distribution balance, and recovery trends</p>
      </div>

      <WorkoutHeatmap />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressCharts />
        <MuscleRadarChart />
      </div>

      <NutritionCharts />
    </div>
  );
}
