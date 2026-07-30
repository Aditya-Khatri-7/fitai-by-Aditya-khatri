import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { StreakStatusCard } from '../components/workout/StreakStatusCard';
import { WorkoutBuilder } from '../components/workout/WorkoutBuilder';
import { AISwapModal } from '../components/workout/AISwapModal';
import { WorkoutHistory } from '../components/workout/WorkoutHistory';
import { VersionCompare } from '../components/workout/VersionCompare';
import { WorkoutSimulator } from '../components/workout/WorkoutSimulator';
import { ProgressiveOverload } from '../components/workout/ProgressiveOverload';
import { LiveWorkoutArena } from '../components/workout/LiveWorkoutArena';
import { getSocket } from '../services/socket';

export function WorkoutsPage() {
  const [isLiveArenaOpen, setIsLiveArenaOpen] = useState(false);

  return (
    <DashboardLayout>
      <StreakStatusCard />
      <WorkoutBuilder onStartSession={() => { getSocket().emit('workout:start'); setIsLiveArenaOpen(true); }} />
      <WorkoutSimulator />
      <ProgressiveOverload />
      <VersionCompare />
      <WorkoutHistory />
      <AISwapModal />

      {isLiveArenaOpen && (
        <LiveWorkoutArena onClose={() => setIsLiveArenaOpen(false)} />
      )}
    </DashboardLayout>
  );
}
