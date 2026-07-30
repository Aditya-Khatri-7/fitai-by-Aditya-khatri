import { YOGA_POSES, focusLabel } from '../data/yogaPoses.js';

// Injury bodyPart -> yoga bodyPartsAffected values to exclude, mirroring the
// exclusion pattern in aiService.js's INJURY_BODY_PART_EXCLUSIONS but against this
// module's own affected-body-part vocabulary.
const YOGA_INJURY_EXCLUSIONS = {
  knee: ['quadriceps', 'calves'],
  lower_back: ['lower_back'],
  shoulder: ['shoulders'],
  hip: ['hips', 'groin', 'hip_flexors'],
  ankle: ['calves']
};

// Poses that bear significant weight on the wrists — excluded separately since
// 'wrist' isn't itself a tracked stretch/strengthen target in the pose catalog.
const WRIST_LOAD_BEARING_POSE_IDS = new Set(['downward_dog', 'plank', 'cat_cow', 'cobra']);

const LEVEL_RANK = { beginner: 0, intermediate: 1, advanced: 2 };

const DURATION_POSE_COUNT = { 15: 3, 30: 5, 45: 7, 60: 9 };

function excludedYogaBodyPartsFor(injuries = []) {
  const excluded = new Set();
  for (const inj of injuries) {
    if (!inj?.isActive) continue;
    (YOGA_INJURY_EXCLUSIONS[inj.bodyPart] || []).forEach(p => excluded.add(p));
  }
  return excluded;
}

function isPoseSafe(pose, excludedParts, hasWristInjury) {
  if (hasWristInjury && WRIST_LOAD_BEARING_POSE_IDS.has(pose.id)) return false;
  const affected = [...pose.bodyPartsAffected.stretched, ...pose.bodyPartsAffected.strengthened];
  return !affected.some(p => excludedParts.has(p));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function poseToExercise(pose) {
  const isRestPose = pose.id === 'corpse';
  return {
    exerciseId: pose.id,
    name: pose.name,
    muscleGroups: { primary: pose.bodyPartsAffected.strengthened, secondary: pose.bodyPartsAffected.stretched },
    sets: 1,
    reps: isRestPose ? '3-5 min' : (pose.id === 'plank' ? '20-45 sec' : '5-8 breaths'),
    weight: 'Bodyweight',
    equipment: 'Body Only',
    notes: pose.benefits,
    instructions: pose.steps.join(' ')
  };
}

/** Builds a real yoga session from the curated pose catalog, filtered by the
 * questionnaire answers and the user's active injuries — same rule-based,
 * injury-aware pattern as buildFallbackWorkout() in aiService.js. */
export function buildYogaSession({ level = 'beginner', goal = 'flexibility', focusArea = 'full_body', duration = 30 }, injuries = []) {
  const excludedParts = excludedYogaBodyPartsFor(injuries);
  const hasWristInjury = (injuries || []).some(i => i?.isActive && i.bodyPart === 'wrist');
  const maxRank = LEVEL_RANK[level] ?? 0;

  const safePool = YOGA_POSES.filter(p =>
    p.id !== 'cat_cow' && p.id !== 'corpse' &&
    (LEVEL_RANK[p.level] ?? 0) <= maxRank &&
    isPoseSafe(p, excludedParts, hasWristInjury)
  );

  const focused = focusArea === 'full_body' ? safePool : safePool.filter(p => p.focusAreas.includes(focusArea));
  const pool = focused.length >= 3 ? focused : safePool;

  const targetCount = DURATION_POSE_COUNT[duration] || 5;
  const mainSequence = shuffle(pool).slice(0, targetCount);

  const catCow = YOGA_POSES.find(p => p.id === 'cat_cow');
  const corpse = YOGA_POSES.find(p => p.id === 'corpse');
  const sequence = [
    ...(isPoseSafe(catCow, excludedParts, hasWristInjury) ? [catCow] : []),
    ...mainSequence,
    corpse
  ];

  const exercises = sequence.map(poseToExercise);

  return {
    title: `${focusLabel(focusArea)} Yoga Flow`,
    type: 'flexibility',
    splitFocus: focusLabel(focusArea),
    durationTarget: duration,
    exercises,
    aiExplanation: `Built a ${duration}-minute ${level} yoga sequence targeting ${focusLabel(focusArea).toLowerCase()}, goal: ${goal.replace('_', ' ')}.${excludedParts.size ? ' Poses adjusted around your active injuries.' : ''}`
  };
}
