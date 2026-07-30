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

export function fallbackBodyFat(req) {
  const neck = req?.neck_cm || 38;
  const abdomen = req?.abdomen_cm || 90;
  const height = req?.height_cm || 175;
  const bf = 495 / (1.0324 - 0.19077 * Math.log10(Math.max(abdomen - neck, 1)) + 0.15456 * Math.log10(height)) - 450;
  const score = Math.round(Math.min(60, Math.max(2, bf)) * 10) / 10;
  return {
    bodyfat_pct: score,
    category: score < 14 ? 'Essential/Athletic' : score < 20 ? 'Fit' : score < 25 ? 'Average' : 'Above Average',
    disclaimer: 'Wellness estimate only, model offline — rule-based approximation.',
    fields_defaulted: []
  };
}

export function fallbackDiabetesRisk(req) {
  const glucose = req?.glucose || 100;
  const score = Math.round(Math.min(1, Math.max(0, (glucose - 70) / 130)) * 100) / 100;
  return {
    risk_level: score > 0.5 ? 'elevated' : 'low',
    probability: score,
    disclaimer: 'Wellness screening only — not a medical diagnosis. Consult a healthcare provider. (Model offline, rule fallback active.)',
    caveat_note: null
  };
}

export function fallbackCardioRisk(req) {
  const bp = req?.resting_bp || 120;
  const score = Math.round(Math.min(1, Math.max(0, (bp - 100) / 100)) * 100) / 100;
  return {
    risk_level: score > 0.5 ? 'elevated' : 'low',
    probability: score,
    disclaimer: 'Wellness screening only — not a medical diagnosis. Consult a healthcare provider. (Model offline, rule fallback active.)',
    fields_defaulted: req?.cholesterol == null ? ['cholesterol'] : []
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
