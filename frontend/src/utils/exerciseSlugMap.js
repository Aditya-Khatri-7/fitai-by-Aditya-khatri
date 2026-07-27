export function getExerciseSlug(exerciseName = '') {
  if (!exerciseName) return 'idle';
  
  const lower = exerciseName.toLowerCase();
  
  if (lower.includes('bench press') || lower.includes('chest press')) {
    if (lower.includes('incline')) return 'incline_dumbbell_press';
    if (lower.includes('decline')) return 'decline_bench_press';
    return 'bench_press';
  }
  if (lower.includes('push-up') || lower.includes('pushup')) return 'pushup';
  if (lower.includes('shoulder press') || lower.includes('overhead press')) return 'shoulder_press';
  if (lower.includes('squat')) return 'squat';
  if (lower.includes('deadlift')) return 'deadlift';
  if (lower.includes('row')) return 'barbell_row';
  if (lower.includes('pulldown')) return 'lat_pulldown';
  if (lower.includes('pull-up') || lower.includes('pullup') || lower.includes('chin-up')) return 'pullup';
  if (lower.includes('curl')) return 'bicep_curl';
  if (lower.includes('extension') || lower.includes('triceps')) return 'tricep_extension';
  if (lower.includes('leg press')) return 'leg_press';
  if (lower.includes('lunge')) return 'lunge';

  return lower.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'idle';
}

export function getExerciseMetadata(exerciseName = '') {
  const slug = getExerciseSlug(exerciseName);
  
  const catalog = {
    bench_press: {
      primaryMuscles: ['Pectoralis Major', 'Triceps Brachii'],
      secondaryMuscles: ['Anterior Deltoids', 'Serratus Anterior'],
      difficulty: 'Intermediate',
      equipment: 'Barbell & Flat Bench',
      tempo: '3-1-1-0 (Controlled Eccentric)',
      restTime: '90 - 120s',
      executionTip: 'Maintain a slight arch in your lower back, keep your feet planted flat on the floor, and drive the barbell in a slight arc back towards your upper chest.',
      commonMistakes: 'Bouncing the barbell off the chest or letting your elbows flare excessively to 90 degrees.',
      aiGuidance: 'Based on your current recovery score, adjust load accordingly and keep zero elbow flare to maximize upper chest hypertrophy without shoulder impingement.'
    },
    incline_dumbbell_press: {
      primaryMuscles: ['Upper Pectoralis Major (Clavicular Head)'],
      secondaryMuscles: ['Anterior Deltoids', 'Triceps'],
      difficulty: 'Intermediate',
      equipment: 'Adjustable Bench & Dumbbells',
      tempo: '2-1-1-0',
      restTime: '90s',
      executionTip: 'Set the bench to a 30-degree incline. Press dumbbells up and slightly together without clanking them at the top.',
      commonMistakes: 'Setting the bench angle too steep (>45 degrees), which shifts load to front deltoids.',
      aiGuidance: 'Dumbbell path allows natural wrist rotation. Great choice for knee-strain safety.'
    },
    shoulder_press: {
      primaryMuscles: ['Anterior & Lateral Deltoids'],
      secondaryMuscles: ['Triceps Brachii', 'Upper Trapezius'],
      difficulty: 'Intermediate',
      equipment: 'Seated Bench & Dumbbells',
      tempo: '3-0-1-0',
      restTime: '90s',
      executionTip: 'Keep your core tight and back supported. Lower dumbbells until upper arms are parallel to the floor before pressing vertically overhead.',
      commonMistakes: 'Arching lower back excessively or pressing too far forward.',
      aiGuidance: 'Seated position eliminates lumbar stress while maintaining progressive overload.'
    },
    pushup: {
      primaryMuscles: ['Pectoralis Major', 'Core / Rectus Abdominis'],
      secondaryMuscles: ['Triceps Brachii', 'Anterior Deltoids'],
      difficulty: 'Beginner / Intermediate',
      equipment: 'Bodyweight / Plates',
      tempo: '2-1-1-0',
      restTime: '60s',
      executionTip: 'Maintain a rigid plank posture from head to heels. Lower your chest until it nearly touches the floor while keeping elbows angled at 45 degrees.',
      commonMistakes: 'Sagging hips, flaring elbows wide, or partial range of motion.',
      aiGuidance: 'Weighted decline push-ups build upper chest density with zero axial spine load.'
    },
    squat: {
      primaryMuscles: ['Quadriceps Femoris', 'Gluteus Maximus'],
      secondaryMuscles: ['Hamstrings', 'Core', 'Erector Spinae'],
      difficulty: 'Advanced',
      equipment: 'Barbell & Power Rack',
      tempo: '3-1-1-0',
      restTime: '120s',
      executionTip: 'Brace core, sit back into hips, drive knees outward inline with toes, and break parallel before driving up.',
      commonMistakes: 'Knee valgus collapse or rounding the lower back at the bottom.',
      aiGuidance: 'Active right knee strain detected: AI recommends machine leg press or light tempo squats under 60kg.'
    },
    deadlift: {
      primaryMuscles: ['Gluteus Maximus', 'Hamstrings', 'Erector Spinae'],
      secondaryMuscles: ['Latissimus Dorsi', 'Trapezius', 'Forearm Flexors'],
      difficulty: 'Advanced',
      equipment: 'Barbell & Bumper Plates',
      tempo: '2-1-1-0',
      restTime: '150s',
      executionTip: 'Hinge at the hips, grip the bar tight, pull slack out of the bar, and drive through the floor keeping the bar close to shins.',
      commonMistakes: 'Jerking the bar off the floor or hyperextending lower back at lockout.',
      aiGuidance: 'High CNS tax exercise. Ensure 48 hours recovery before heavy leg or back training.'
    }
  };

  return catalog[slug] || {
    primaryMuscles: ['Target Muscle Group'],
    secondaryMuscles: ['Stabilizers', 'Synergists'],
    difficulty: 'Intermediate',
    equipment: 'Gym / Home Equipment',
    tempo: '2-1-1-0',
    restTime: '90s',
    executionTip: 'Focus on explosive concentric contraction, full range of motion, and smooth controlled eccentric deceleration.',
    commonMistakes: 'Using momentum instead of controlled muscle tension.',
    aiGuidance: 'Exercise parameters dynamically calibrated based on your current recovery score and health telemetry.'
  };
}
