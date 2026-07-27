import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { MealPlanner } from '../components/nutrition/MealPlanner';

export function NutritionPage() {
  return (
    <DashboardLayout>
      <MealPlanner />
    </DashboardLayout>
  );
}
