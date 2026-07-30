import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { RecoveryScoreRing } from '../components/dashboard/RecoveryScoreRing';
import { BiometricSignals } from '../components/dashboard/BiometricSignals';
import { TodayWorkoutCard } from '../components/dashboard/TodayWorkoutCard';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { WorkoutCalendarStrip } from '../components/dashboard/WorkoutCalendarStrip';
import { GreetingInsightCard } from '../components/dashboard/GreetingInsightCard';
import { GoalProgressRing } from '../components/dashboard/GoalProgressRing';
import { QuickActions } from '../components/dashboard/QuickActions';
import { MLInsightsCard } from '../components/dashboard/MLInsightsCard';
import { StressCheckCard } from '../components/dashboard/StressCheckCard';
import { ActivityRecognitionCard } from '../components/dashboard/ActivityRecognitionCard';
import { DailyQuestsCard } from '../components/dashboard/DailyQuestsCard';
import { CheatSummaryCard } from '../components/dashboard/CheatSummaryCard';
import { fetchTodayWorkout } from '../redux/slices/workoutSlice';
import { fetchHealthSnapshot } from '../redux/slices/healthSlice';

export function DashboardPage() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { todayWorkout } = useSelector(state => state.workout);
  const { todayMetrics } = useSelector(state => state.health);
  const { mobileMode } = useTheme();
  const [mlRecovery, setMlRecovery] = useState(null);
  const [mlInjuryRisk, setMlInjuryRisk] = useState(null);

  useEffect(() => {
    dispatch(fetchTodayWorkout());
    dispatch(fetchHealthSnapshot());
  }, [dispatch]);

  // Calls the trained XGBoost recovery/injury models directly rather than
  // relying on the client-side recoveryCalculator estimate everywhere — the
  // models were already trained and served but nothing in the UI called them.
  useEffect(() => {
    if (!todayMetrics) return;
    const bmi = user?.profile?.weight && user?.profile?.height
      ? user.profile.weight / ((user.profile.height / 100) ** 2)
      : undefined;

    api.post('/ml/recovery', {
      sleep_duration: todayMetrics.sleep?.duration,
      sleep_quality: todayMetrics.sleep?.quality,
      stress_level: todayMetrics.stress,
      resting_hr: todayMetrics.heartRate?.resting,
      active_hr: todayMetrics.heartRate?.active,
      steps: todayMetrics.steps,
      hydration: todayMetrics.hydration,
      soreness_level: todayMetrics.soreness?.level,
      age: user?.profile?.age,
      bmi
    }).then(({ data }) => {
      setMlRecovery(data);
      // Only the fields the dashboard actually has real data for are sent —
      // the rest fall back to the ML service's own request-model defaults.
      return api.post('/ml/injury-risk', {
        sleep_avg_7d: todayMetrics.sleep?.duration,
        recovery_score_avg: data.recovery_score,
        age: user?.profile?.age,
        previous_injuries_count: user?.injuries?.length || 0
      });
    }).then((res) => res && setMlInjuryRisk(res.data))
      .catch(() => { /* dashboard already has a local estimate fallback */ });
  }, [todayMetrics, user]);

  const gridClass = `grid grid-cols-1 ${mobileMode ? 'grid-cols-1' : 'lg:grid-cols-3'} gap-4 sm:gap-6`;
  const span2Class = mobileMode ? 'col-span-1' : 'lg:col-span-2';

  return (
    <DashboardLayout>
      <QuickActions />

      {/* Greeting merged with the Daily AI Insight */}
      <GreetingInsightCard user={user} metrics={todayMetrics} mlPrediction={mlRecovery} />

      {/* Gamified Daily Quests & Level Hub */}
      <DailyQuestsCard />

      <MLInsightsCard />

      {/* Top Biometric & Recovery Grid */}
      <div className={gridClass}>
        <RecoveryScoreRing metrics={todayMetrics} user={user} mlPrediction={mlRecovery} injuryRisk={mlInjuryRisk} />
        <div className={span2Class}>
          <BiometricSignals metrics={todayMetrics} />
        </div>
      </div>

      {/* Key Metrics */}
      <StatsGrid metrics={todayMetrics} streak={user?.streak} />

      {/* Today's Workout Feature Card */}
      <TodayWorkoutCard workout={todayWorkout} />

      {/* Goal Progress Ring & Calendar Strip */}
      <div className={gridClass}>
        <GoalProgressRing goal={user?.currentGoal} currentValue={user?.profile?.weight} />
        <div className={span2Class}>
          <WorkoutCalendarStrip />
        </div>
      </div>

      {/* Newly wired: skin-sensor stress + accelerometer activity classifiers */}
      <div className={gridClass}>
        <div className={span2Class}>
          <StressCheckCard />
        </div>
        <ActivityRecognitionCard />
      </div>

      <CheatSummaryCard />
    </DashboardLayout>
  );
}
