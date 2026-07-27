import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { RecoveryScoreRing } from '../components/dashboard/RecoveryScoreRing';
import { BiometricSignals } from '../components/dashboard/BiometricSignals';
import { TodayWorkoutCard } from '../components/dashboard/TodayWorkoutCard';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { WorkoutCalendarStrip } from '../components/dashboard/WorkoutCalendarStrip';
import { AIInsightCard } from '../components/dashboard/AIInsightCard';
import { GoalProgressRing } from '../components/dashboard/GoalProgressRing';
import { QuickActions } from '../components/dashboard/QuickActions';
import { MLInsightsCard } from '../components/dashboard/MLInsightsCard';
import { DailyQuestsCard } from '../components/dashboard/DailyQuestsCard';
import { fetchTodayWorkout } from '../redux/slices/workoutSlice';
import { fetchHealthSnapshot } from '../redux/slices/healthSlice';

export function DashboardPage() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { todayWorkout } = useSelector(state => state.workout);
  const { todayMetrics } = useSelector(state => state.health);
  const { mobileMode } = useTheme();

  useEffect(() => {
    dispatch(fetchTodayWorkout());
    dispatch(fetchHealthSnapshot());
  }, [dispatch]);

  const gridClass = `grid grid-cols-1 ${mobileMode ? 'grid-cols-1' : 'lg:grid-cols-3'} gap-4 sm:gap-6`;
  const span2Class = mobileMode ? 'col-span-1' : 'lg:col-span-2';

  return (
    <DashboardLayout>
      <QuickActions />

      {/* Gamified Daily Quests & Level Hub */}
      <DailyQuestsCard />

      <MLInsightsCard />

      {/* Top Biometric & Recovery Grid */}
      <div className={gridClass}>
        <RecoveryScoreRing metrics={todayMetrics} user={user} />
        <div className={span2Class}>
          <BiometricSignals metrics={todayMetrics} />
        </div>
      </div>

      {/* Today's Workout Feature Card */}
      <TodayWorkoutCard workout={todayWorkout} />

      {/* Middle Key Metrics & AI Insight Grid */}
      <div className={gridClass}>
        <div className={span2Class}>
          <StatsGrid metrics={todayMetrics} streak={user?.streak} />
        </div>
        <AIInsightCard user={user} metrics={todayMetrics} />
      </div>

      {/* Goal Progress Ring & Calendar Strip */}
      <div className={gridClass}>
        <GoalProgressRing goal={user?.currentGoal} currentValue={user?.profile?.weight} />
        <div className={span2Class}>
          <WorkoutCalendarStrip />
        </div>
      </div>
    </DashboardLayout>
  );
}
