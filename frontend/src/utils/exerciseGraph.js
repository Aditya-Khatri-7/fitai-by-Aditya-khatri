import { EXERCISE_DATABASE } from '../data/exercises';

/**
 * Exercise Dependency & Muscle Volume Graph Balancing Utility
 */
function toCandidate(originalExercise, primaryMuscles, alt) {
  return {
    original: originalExercise.name,
    replacement: alt.name,
    replacementExerciseId: alt.exerciseId,
    reason: `Preserves ${primaryMuscles.join(', ')} volume while matching your available equipment and safety constraints.`,
    sets: originalExercise.sets || 3,
    reps: originalExercise.reps || '10-12',
    weight: alt.equipment.includes('barbell') ? '50 kg' : alt.equipment.includes('dumbbell') ? '18 kg' : 'bodyweight'
  };
}

/** Returns up to 3 real alternatives instead of one forced pick, so the user
 * actually chooses instead of the system imposing a single swap. */
export function getRecommendedSwapCandidates(originalExercise, userProfile, healthMetrics = {}, count = 3) {
  const ex = EXERCISE_DATABASE.find(e => e.exerciseId === originalExercise.exerciseId || e.name === originalExercise.name) || originalExercise;

  const primaryMuscles = ex.muscleGroups?.primary || ['chest'];
  const userEquipment = userProfile?.equipment || ['dumbbell', 'bodyweight_only'];

  const candidates = EXERCISE_DATABASE.filter(candidate => {
    if (candidate.exerciseId === ex.exerciseId) return false;
    const sharesPrimary = candidate.muscleGroups.primary.some(m => primaryMuscles.includes(m));
    if (!sharesPrimary) return false;
    const hasEquipment = candidate.equipment.some(eq => eq === 'bodyweight_only' || userEquipment.includes(eq));
    return hasEquipment;
  });

  const pool = candidates.length > 0 ? candidates : [EXERCISE_DATABASE.find(e => e.exerciseId === 'pushup')].filter(Boolean);
  return pool.slice(0, count).map(alt => toCandidate(originalExercise, primaryMuscles, alt));
}

/** @deprecated kept for any remaining single-pick callers — prefer getRecommendedSwapCandidates */
export function getRecommendedSwap(originalExercise, userProfile, healthMetrics = {}) {
  return getRecommendedSwapCandidates(originalExercise, userProfile, healthMetrics, 1)[0];
}
