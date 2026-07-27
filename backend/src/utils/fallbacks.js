export function fallbackRecoveryScore(biometrics) {
  const sleep = biometrics?.sleepQuality || 75;
  const stress = biometrics?.stressLevel || 30;
  const soreness = biometrics?.sorenessLevel || 3;
  const score = Math.round(Math.min(100, Math.max(0, (sleep * 0.35) + ((10 - soreness) * 3.5) + ((100 - stress) * 0.3))));
  return {
    recovery_score: score,
    recovery_level: score >= 75 ? 'Optimal' : score >= 45 ? 'Moderate' : 'Critical Rest',
    limiting_factors: ['Local Rule Engine Active (Fallback)'],
    top_contributors: { sleep: 0.35, soreness: 0.35, stress: 0.30 }
  };
}

export function fallbackInjuryRisk(userContext) {
  const isHighFreq = (userContext.workoutFrequency || 5) > 5;
  const isLowSleep = (userContext.sleepAvg || 7) < 6;
  const isLowRec = (userContext.recoveryScore || 75) < 45;

  let risk = 'low';
  let prob = 0.15;
  if (isHighFreq && isLowRec) { risk = 'high'; prob = 0.82; }
  else if (isLowSleep || isLowRec) { risk = 'medium'; prob = 0.48; }

  return {
    injury_risk: risk,
    risk_probability: prob,
    risk_breakdown: { low: risk === 'low' ? 0.85 : 0.1, medium: risk === 'medium' ? 0.80 : 0.15, high: risk === 'high' ? 0.82 : 0.05 },
    warning_message: risk === 'high' ? 'High injury risk detected via rule fallback.' : 'Healthy training load.'
  };
}
