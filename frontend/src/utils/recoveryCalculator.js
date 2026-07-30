// Single source of truth for the weighted-average formula below, so any UI
// that needs to explain "why this score" (e.g. GreetingInsightCard's
// breakdown panel) reads the real weights instead of duplicating them.
export const RECOVERY_SCORE_WEIGHTS = {
  sleepQuality: 0.25,
  inverseSoreness: 0.25,
  inverseStress: 0.20,
  hrDeltaScore: 0.18,
  hydrationScore: 0.12
};

/**
 * Calculates recovery score (0-100%) from health metrics and user profile
 */
export function calculateRecoveryScore(metrics, userProfile = {}) {
  if (!metrics) {
    return {
      score: null,
      status: 'Uncalibrated',
      color: '#64748B',
      category: 'Sync Wearable to Calculate',
      isUncalibrated: true,
      breakdown: {
        sleepQuality: 0,
        inverseSoreness: 0,
        inverseStress: 0,
        hrDeltaScore: 0,
        hydrationScore: 0
      },
      weights: RECOVERY_SCORE_WEIGHTS
    };
  }

  const sleepQuality = metrics.sleep?.quality || 75;
  
  const sorenessLevel = metrics.soreness?.level || 3;
  const inverseSoreness = (10 - Math.min(Math.max(sorenessLevel, 0), 10)) * 10;
  
  const stressLevel = metrics.stress || 30;
  const inverseStress = 100 - Math.min(Math.max(stressLevel, 0), 100);
  
  const restingHR = metrics.heartRate?.resting || 65;
  const baselineHR = 62; // Baseline
  const hrDiff = Math.abs(restingHR - baselineHR);
  const hrDeltaScore = Math.max(0, 100 - (hrDiff * 2));
  
  const hydrationGlasses = metrics.hydration || 6;
  const hydrationScore = Math.min(100, (hydrationGlasses / 8) * 100);

  let rawScore =
    (sleepQuality * RECOVERY_SCORE_WEIGHTS.sleepQuality) +
    (inverseSoreness * RECOVERY_SCORE_WEIGHTS.inverseSoreness) +
    (inverseStress * RECOVERY_SCORE_WEIGHTS.inverseStress) +
    (hrDeltaScore * RECOVERY_SCORE_WEIGHTS.hrDeltaScore) +
    (hydrationScore * RECOVERY_SCORE_WEIGHTS.hydrationScore);

  // Apply Chronic Condition & Injury Modifiers
  const bp = metrics.bloodPressure;
  if (bp && (bp.systolic > 140 || bp.diastolic > 90)) {
    rawScore -= 15;
  }

  if (metrics.bloodSugar && metrics.bloodSugar > 180) {
    rawScore -= 10;
  }

  const activeInjuries = userProfile.injuries?.filter(i => i.isActive) || [];
  activeInjuries.forEach(inj => {
    if (inj.severity === 'severe') rawScore -= 20;
    else if (inj.severity === 'moderate') rawScore -= 10;
    else rawScore -= 5;
  });

  const finalScore = Math.round(Math.min(100, Math.max(0, rawScore)));

  let status = 'Optimal';
  let color = '#10B981'; // Emerald
  let category = 'Prime State';

  if (finalScore < 40) {
    status = 'Critical Recovery';
    color = '#F43F5E'; // Rose
    category = 'Rest & Stretch';
  } else if (finalScore < 70) {
    status = 'Moderate Fatigue';
    color = '#F59E0B'; // Amber
    category = 'Light / Technique';
  }

  return {
    score: finalScore,
    status,
    color,
    category,
    breakdown: {
      sleepQuality,
      inverseSoreness,
      inverseStress,
      hrDeltaScore,
      hydrationScore
    },
    weights: RECOVERY_SCORE_WEIGHTS
  };
}
