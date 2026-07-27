import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard';

export function AnalyticsPage() {
  return (
    <DashboardLayout>
      <AnalyticsDashboard />
    </DashboardLayout>
  );
}
