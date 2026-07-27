import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { GamifiedProfile } from '../components/profile/GamifiedProfile';

export function ProfilePage() {
  return (
    <DashboardLayout>
      <GamifiedProfile />
    </DashboardLayout>
  );
}
