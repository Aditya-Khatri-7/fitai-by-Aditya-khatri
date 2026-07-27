/**
 * Detects exercise conflicts, medical contraindications, and intensity warnings
 */
export function detectExerciseConflicts(exercise, userProfile, healthMetrics = {}) {
  const metrics = healthMetrics || {};
  const conflicts = [];
  const activeInjuries = userProfile?.injuries?.filter(i => i.isActive) || [];
  const chronicConditions = userProfile?.healthProfile?.chronicConditions || [];
  const recoveryScore = metrics.recoveryScore || 75;

  // 1. Injury Checks
  activeInjuries.forEach(inj => {
    const part = inj.bodyPart.toLowerCase();
    const exName = exercise.name.toLowerCase();

    if (part === 'knee') {
      if (exName.includes('squat') || exName.includes('lunge') || exName.includes('jump')) {
        conflicts.push({
          type: 'injury_conflict',
          severity: 'high',
          message: `Active Knee ${inj.severity || 'Strain'}: High knee flexion stress detected. Recommend low-impact machine alternative (e.g. Leg Press).`
        });
      }
    }

    if (part === 'shoulder') {
      if (exName.includes('overhead') || exName.includes('bench press') || exName.includes('dip')) {
        conflicts.push({
          type: 'injury_conflict',
          severity: 'high',
          message: `Active Shoulder Impingement: Subacromial joint stress. Recommend chest fly or lateral raise instead.`
        });
      }
    }

    if (part === 'lower_back') {
      if (exName.includes('deadlift') || exName.includes('barbell squat') || exName.includes('row')) {
        conflicts.push({
          type: 'injury_conflict',
          severity: 'high',
          message: `Active Lumbar Strain: High axial spinal loading detected.`
        });
      }
    }
  });

  // 2. Chronic Disease Checks (Hypertension)
  const hypertension = chronicConditions.find(c => c.condition === 'hypertension');
  if (hypertension) {
    if (exercise.category === 'compound' && (exercise.name.includes('Barbell') || exercise.name.includes('Heavy'))) {
      conflicts.push({
        type: 'hypertension_warning',
        severity: 'medium',
        message: 'Hypertension Alert: Avoid heavy Valsalva maneuver. Keep reps higher (12-15) with lighter loads.'
      });
    }
  }

  // 3. Low Recovery Check
  if (recoveryScore < 40 && exercise.category === 'compound') {
    conflicts.push({
      type: 'recovery_warning',
      severity: 'high',
      message: `Critical Recovery (${recoveryScore}%): Heavy compound exercises increase CNS fatigue and injury risk. Convert to mobility/light active recovery.`
    });
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
}
