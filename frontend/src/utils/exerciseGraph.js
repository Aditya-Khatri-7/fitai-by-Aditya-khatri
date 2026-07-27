import { EXERCISE_DATABASE } from '../data/exercises';

/**
 * Exercise Dependency & Muscle Volume Graph Balancing Utility
 */
export function getRecommendedSwap(originalExercise, userProfile, healthMetrics = {}) {
  const ex = EXERCISE_DATABASE.find(e => e.exerciseId === originalExercise.exerciseId || e.name === originalExercise.name) || originalExercise;
  
  const primaryMuscles = ex.muscleGroups?.primary || ['chest'];
  const userEquipment = userProfile?.equipment || ['dumbbell', 'bodyweight_only'];

  // Find candidate exercises targeting the same primary muscle group that match user equipment
  const candidates = EXERCISE_DATABASE.filter(candidate => {
    if (candidate.exerciseId === ex.exerciseId) return false;
    
    // Muscle group overlap
    const sharesPrimary = candidate.muscleGroups.primary.some(m => primaryMuscles.includes(m));
    if (!sharesPrimary) return false;

    // Equipment match
    const hasEquipment = candidate.equipment.some(eq => eq === 'bodyweight_only' || userEquipment.includes(eq));
    return hasEquipment;
  });

  const selectedAlternative = candidates[0] || EXERCISE_DATABASE.find(e => e.exerciseId === 'pushup');

  return {
    original: ex.name,
    replacement: selectedAlternative.name,
    replacementExerciseId: selectedAlternative.exerciseId,
    reason: `Selected ${selectedAlternative.name} to preserve ${primaryMuscles.join(', ')} volume while accommodating user equipment and safety constraints.`,
    sets: originalExercise.sets || 3,
    reps: originalExercise.reps || '10-12',
    weight: selectedAlternative.equipment.includes('barbell') ? '50 kg' : selectedAlternative.equipment.includes('dumbbell') ? '18 kg' : 'bodyweight'
  };
}
