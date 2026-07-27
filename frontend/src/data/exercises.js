export const EXERCISE_DATABASE = [
  {
    exerciseId: 'bench_press',
    name: 'Barbell Bench Press',
    category: 'compound',
    muscleGroups: {
      primary: ['chest'],
      secondary: ['shoulders', 'triceps']
    },
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    contraindications: [
      { condition: 'shoulder_pain', reason: 'High anterior shoulder strain at bottom position' },
      { condition: 'hypertension', reason: 'Heavy Valsalva maneuver can spike blood pressure' }
    ],
    instructions: 'Lie on bench, unrack barbell, lower to mid-chest with elbows at 45-degree angle, press upward firmly.',
    videoUrl: 'https://www.youtube.com/embed/rT7DgCr-3pg',
    alternatives: ['dumbbell_press', 'pushup', 'chest_fly']
  },
  {
    exerciseId: 'dumbbell_press',
    name: 'Dumbbell Chest Press',
    category: 'compound',
    muscleGroups: {
      primary: ['chest'],
      secondary: ['shoulders', 'triceps']
    },
    equipment: ['dumbbell', 'bench'],
    difficulty: 'beginner',
    contraindications: [],
    instructions: 'Hold dumbbells at chest level, lie back on bench, press weights vertically focusing on chest squeeze.',
    videoUrl: 'https://www.youtube.com/embed/VmB1G1K7v94',
    alternatives: ['bench_press', 'pushup']
  },
  {
    exerciseId: 'pushup',
    name: 'Standard Push-Up',
    category: 'compound',
    muscleGroups: {
      primary: ['chest'],
      secondary: ['shoulders', 'triceps', 'core']
    },
    equipment: ['bodyweight_only'],
    difficulty: 'beginner',
    contraindications: [
      { condition: 'wrist_pain', reason: 'Wrist extension under bodyweight pressure' }
    ],
    instructions: 'Maintain rigid plank position, lower chest to floor, push back up engaging core throughout.',
    videoUrl: 'https://www.youtube.com/embed/IODxDxX7oi4',
    alternatives: ['dumbbell_press', 'knee_pushup']
  },
  {
    exerciseId: 'barbell_squat',
    name: 'Barbell Back Squat',
    category: 'compound',
    muscleGroups: {
      primary: ['quadriceps', 'glutes'],
      secondary: ['hamstrings', 'lower_back']
    },
    equipment: ['barbell', 'rack'],
    difficulty: 'intermediate',
    contraindications: [
      { condition: 'knee_pain', reason: 'High knee flexion stress under heavy axial load' },
      { condition: 'lower_back_pain', reason: 'Spinal compression forces' }
    ],
    instructions: 'Barbell across upper traps, feet shoulder-width, sit hips back and down until thighs parallel to ground.',
    videoUrl: 'https://www.youtube.com/embed/ultWZbUMPL8',
    alternatives: ['leg_press', 'goblet_squat', 'bodyweight_squat']
  },
  {
    exerciseId: 'leg_press',
    name: 'Machine Leg Press',
    category: 'compound',
    muscleGroups: {
      primary: ['quadriceps'],
      secondary: ['glutes', 'hamstrings']
    },
    equipment: ['machine'],
    difficulty: 'beginner',
    contraindications: [],
    instructions: 'Place feet mid-sled, lower weight smoothly to 90 degrees knee bend, press back without locking knees.',
    videoUrl: 'https://www.youtube.com/embed/IZxyjW7MPJQ',
    alternatives: ['barbell_squat', 'goblet_squat']
  },
  {
    exerciseId: 'deadlift',
    name: 'Conventional Deadlift',
    category: 'compound',
    muscleGroups: {
      primary: ['hamstrings', 'glutes', 'lower_back'],
      secondary: ['upper_back', 'forearms', 'core']
    },
    equipment: ['barbell'],
    difficulty: 'advanced',
    contraindications: [
      { condition: 'lower_back_pain', reason: 'High lumbar shear stress' },
      { condition: 'hypertension', reason: 'Intense intra-abdominal pressure' }
    ],
    instructions: 'Barbell over midfoot, hinge hips back, grab bar with flat back, drive floor away pushing hips forward.',
    videoUrl: 'https://www.youtube.com/embed/op9kVnSso6Q',
    alternatives: ['romanian_deadlift', 'kettlebell_swing', 'glute_bridge']
  },
  {
    exerciseId: 'overhead_press',
    name: 'Barbell Overhead Press',
    category: 'compound',
    muscleGroups: {
      primary: ['shoulders'],
      secondary: ['triceps', 'upper_chest']
    },
    equipment: ['barbell'],
    difficulty: 'intermediate',
    contraindications: [
      { condition: 'shoulder_pain', reason: 'Subacromial impingement potential at top extension' }
    ],
    instructions: 'Bar at collarbone, brace core, press vertically overhead clearing chin, lock out arms smoothly.',
    videoUrl: 'https://www.youtube.com/embed/2yjwXTZQDDI',
    alternatives: ['dumbbell_shoulder_press', 'lateral_raise']
  },
  {
    exerciseId: 'pullup',
    name: 'Pull-Up',
    category: 'compound',
    muscleGroups: {
      primary: ['lats', 'upper_back'],
      secondary: ['biceps']
    },
    equipment: ['pull_up_bar'],
    difficulty: 'intermediate',
    contraindications: [
      { condition: 'elbow_pain', reason: 'Brachialis & tendon strain in full deadhang' }
    ],
    instructions: 'Overhand grip slightly wider than shoulders, pull chest to bar driving elbows down, lower under control.',
    videoUrl: 'https://www.youtube.com/embed/eGo4IYlbE5g',
    alternatives: ['lat_pulldown', 'bent_over_row']
  },
  {
    exerciseId: 'lat_pulldown',
    name: 'Cable Lat Pulldown',
    category: 'compound',
    muscleGroups: {
      primary: ['lats'],
      secondary: ['biceps', 'upper_back']
    },
    equipment: ['cable'],
    difficulty: 'beginner',
    contraindications: [],
    instructions: 'Grip bar wide, sit with thighs secured, pull bar to upper chest leaning back slightly, return controlled.',
    videoUrl: 'https://www.youtube.com/embed/CAwf7n6Luuc',
    alternatives: ['pullup', 'seated_cable_row']
  },
  {
    exerciseId: 'walking_lunge',
    name: 'Dumbbell Walking Lunge',
    category: 'compound',
    muscleGroups: {
      primary: ['quadriceps', 'glutes'],
      secondary: ['hamstrings', 'calves']
    },
    equipment: ['dumbbell'],
    difficulty: 'intermediate',
    contraindications: [
      { condition: 'knee_pain', reason: 'High shearing forces on knee joint during forward decelerations' }
    ],
    instructions: 'Step forward landing heel to toe, lower rear knee toward ground, push through front foot to step forward.',
    videoUrl: 'https://www.youtube.com/embed/L8fvypPrzzs',
    alternatives: ['glute_bridge', 'stationary_lunge']
  },
  {
    exerciseId: 'glute_bridge',
    name: 'Glute Bridge / Hip Thrust',
    category: 'isolation',
    muscleGroups: {
      primary: ['glutes'],
      secondary: ['hamstrings']
    },
    equipment: ['bodyweight_only', 'barbell'],
    difficulty: 'beginner',
    contraindications: [],
    instructions: 'Lie on back knees bent, drive through heels to lift hips until body forms straight line knees to shoulders.',
    videoUrl: 'https://www.youtube.com/embed/8bbE64NuDTU',
    alternatives: ['deadlift', 'kettlebell_swing']
  },
  {
    exerciseId: 'stationary_bike',
    name: 'Stationary Cycling (Zone 2)',
    category: 'cardio',
    muscleGroups: {
      primary: ['quadriceps', 'cardiovascular'],
      secondary: ['calves']
    },
    equipment: ['machine'],
    difficulty: 'beginner',
    contraindications: [],
    instructions: 'Adjust seat height so leg has slight bend at bottom, maintain steady RPM at conversational heart rate.',
    videoUrl: 'https://www.youtube.com/embed/4yG-M_ZzI_Y',
    alternatives: ['treadmill_walk', 'elliptical']
  }
];
