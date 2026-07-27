import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { HealthUpdateWizard } from '../components/health/HealthUpdateWizard';

export function HealthUpdatePage() {
  return (
    <DashboardLayout>
      <HealthUpdateWizard />
    </DashboardLayout>
  );
}
