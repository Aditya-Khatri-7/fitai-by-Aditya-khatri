import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { HealthDashboard } from '../components/health/HealthDashboard';

export function HealthPage() {
  return (
    <DashboardLayout>
      <HealthDashboard />
    </DashboardLayout>
  );
}
