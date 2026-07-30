// Real, standard yoga poses (asanas) with their conventional Sanskrit/English names,
// commonly-documented anatomical effects, and standard alignment cues. This is
// established yoga knowledge (the kind found in any yoga teacher-training manual),
// not fabricated per-request — same principle as mealTimingRules.js and the meal
// dataset templates: real domain content, deterministically selected, not
// LLM-invented per session.

export const YOGA_POSES = [
  {
    id: 'mountain', name: 'Tadasana (Mountain Pose)', level: 'beginner', focusAreas: ['full_body', 'balance'],
    bodyPartsAffected: { stretched: ['ankles'], strengthened: ['quadriceps', 'core'] },
    benefits: 'Improves posture and full-body awareness; the foundation alignment for all standing poses.',
    steps: [
      'Stand with feet hip-width apart, weight evenly balanced across both feet.',
      'Engage your thighs and draw your kneecaps up without locking the knees.',
      'Lengthen your spine, roll your shoulders back and down, and let your arms rest at your sides.',
      'Hold for 5-8 breaths, keeping your gaze soft and forward.'
    ]
  },
  {
    id: 'downward_dog', name: 'Adho Mukha Svanasana (Downward-Facing Dog)', level: 'beginner', focusAreas: ['full_body', 'flexibility'],
    bodyPartsAffected: { stretched: ['hamstrings', 'calves', 'lats'], strengthened: ['shoulders', 'triceps'] },
    benefits: 'Stretches the hamstrings and calves while building shoulder and arm strength; a foundational transitional pose.',
    steps: [
      'Start on hands and knees, wrists under shoulders and knees under hips.',
      'Tuck your toes and lift your hips up and back, forming an inverted V shape.',
      'Press your hands firmly into the mat and try to bring your heels toward the floor.',
      'Keep a slight bend in the knees if your hamstrings are tight, and hold for 5-8 breaths.'
    ]
  },
  {
    id: 'childs_pose', name: "Balasana (Child's Pose)", level: 'beginner', focusAreas: ['recovery', 'stress_relief'],
    bodyPartsAffected: { stretched: ['lower_back', 'hips'], strengthened: [] },
    benefits: 'A gentle resting pose that releases tension in the back and hips and calms the nervous system.',
    steps: [
      'Kneel on the mat with big toes touching and knees spread wide.',
      'Sit your hips back toward your heels and fold your torso forward.',
      'Extend your arms in front of you or rest them alongside your body.',
      'Breathe deeply and hold for as long as feels comfortable, 30 seconds to a few minutes.'
    ]
  },
  {
    id: 'warrior_2', name: 'Virabhadrasana II (Warrior II)', level: 'intermediate', focusAreas: ['strength', 'legs'],
    bodyPartsAffected: { stretched: ['hips', 'groin'], strengthened: ['quadriceps', 'glutes', 'shoulders'] },
    benefits: 'Builds lower-body strength and stamina while opening the hips and chest.',
    steps: [
      'Step your feet wide apart, turning your right foot out 90 degrees and left foot slightly in.',
      'Bend your right knee to a 90-degree angle, keeping it tracking over your ankle.',
      'Extend your arms parallel to the floor, gazing over your front fingertips.',
      'Hold for 5-8 breaths, then repeat on the other side.'
    ]
  },
  {
    id: 'triangle', name: 'Trikonasana (Triangle Pose)', level: 'intermediate', focusAreas: ['flexibility', 'core'],
    bodyPartsAffected: { stretched: ['hamstrings', 'obliques', 'hips'], strengthened: ['quadriceps'] },
    benefits: 'Stretches the hamstrings and side body, and builds core stability through rotation control.',
    steps: [
      'Stand with feet wide, right foot turned out, left foot slightly angled in.',
      'Extend your arms parallel to the floor, then hinge at the right hip to reach your right hand toward your shin or the floor.',
      'Extend your left arm straight up, stacking your shoulders.',
      'Hold for 5 breaths, then repeat on the other side.'
    ]
  },
  {
    id: 'tree', name: 'Vrksasana (Tree Pose)', level: 'beginner', focusAreas: ['balance', 'full_body'],
    bodyPartsAffected: { stretched: ['hips'], strengthened: ['calves', 'core', 'ankles'] },
    benefits: 'Builds single-leg balance and ankle stability while improving focus and concentration.',
    steps: [
      'Stand on your left leg, placing your right foot on your inner left calf or thigh (never directly on the knee).',
      'Bring your hands to prayer position at your chest, or extend them overhead.',
      'Fix your gaze on a steady point to help balance.',
      'Hold for 5-8 breaths, then switch sides.'
    ]
  },
  {
    id: 'cobra', name: 'Bhujangasana (Cobra Pose)', level: 'beginner', focusAreas: ['back', 'flexibility'],
    bodyPartsAffected: { stretched: ['abdominals', 'chest'], strengthened: ['lower_back', 'triceps'] },
    benefits: 'Gently strengthens the spine and opens the chest — commonly used to counteract prolonged sitting.',
    steps: [
      'Lie face down with hands under your shoulders, elbows tucked close to your body.',
      'Press into your hands and lift your chest off the floor, keeping a slight bend in the elbows.',
      'Keep your shoulders away from your ears and hips grounded.',
      'Hold for 3-5 breaths, then release back down.'
    ]
  },
  {
    id: 'bridge', name: 'Setu Bandhasana (Bridge Pose)', level: 'beginner', focusAreas: ['back', 'strength'],
    bodyPartsAffected: { stretched: ['chest', 'hip_flexors'], strengthened: ['glutes', 'hamstrings', 'lower_back'] },
    benefits: 'Strengthens the glutes and posterior chain while opening the chest and hip flexors.',
    steps: [
      'Lie on your back with knees bent, feet hip-width apart flat on the floor.',
      'Press into your feet and lift your hips toward the ceiling.',
      'Interlace your hands underneath you for support, or keep palms flat.',
      'Hold for 5-8 breaths, then lower slowly.'
    ]
  },
  {
    id: 'seated_forward_fold', name: 'Paschimottanasana (Seated Forward Fold)', level: 'beginner', focusAreas: ['flexibility', 'stress_relief'],
    bodyPartsAffected: { stretched: ['hamstrings', 'lower_back'], strengthened: [] },
    benefits: 'A deep hamstring and spine stretch that also has a calming effect on the nervous system.',
    steps: [
      'Sit with legs extended straight in front of you.',
      'Inhale to lengthen your spine, then hinge forward from the hips (not the waist).',
      'Reach for your shins, ankles, or feet — wherever you can go without rounding your back excessively.',
      'Hold for 5-8 breaths, breathing into any tightness.'
    ]
  },
  {
    id: 'pigeon', name: 'Eka Pada Rajakapotasana (Pigeon Pose)', level: 'intermediate', focusAreas: ['hips', 'flexibility'],
    bodyPartsAffected: { stretched: ['hips', 'glutes'], strengthened: [] },
    benefits: 'One of the most effective hip-opening poses — especially useful for runners and cyclists with tight hips.',
    steps: [
      'From Downward Dog, bring your right knee forward behind your right wrist, shin angled toward the left.',
      'Extend your left leg straight back behind you.',
      'Square your hips to the front and fold forward over your front leg if comfortable.',
      'Hold for 5-8 breaths, then switch sides.'
    ]
  },
  {
    id: 'plank', name: 'Phalakasana (Plank Pose)', level: 'intermediate', focusAreas: ['core', 'strength'],
    bodyPartsAffected: { stretched: [], strengthened: ['core', 'shoulders', 'quadriceps'] },
    benefits: 'Builds full-body core and shoulder stability, foundational for many vinyasa transitions.',
    steps: [
      'From hands and knees, step your feet back into a straight line from head to heels.',
      'Keep wrists stacked under shoulders and engage your core to avoid sagging hips.',
      'Keep your neck neutral, gazing slightly forward.',
      'Hold for 20-45 seconds depending on your level.'
    ]
  },
  {
    id: 'camel', name: 'Ustrasana (Camel Pose)', level: 'advanced', focusAreas: ['back', 'flexibility'],
    bodyPartsAffected: { stretched: ['chest', 'abdominals', 'hip_flexors'], strengthened: ['lower_back'] },
    benefits: 'A deep backbend that opens the chest and hip flexors — go slowly and never force the depth.',
    steps: [
      'Kneel with hips stacked over knees, tops of feet on the mat.',
      'Place your hands on your lower back for support, fingers pointing down.',
      'Lift your chest and gently arch backward, reaching for your heels only if comfortable.',
      'Hold for 3-5 breaths, then rise slowly, leading with your chest.'
    ]
  },
  {
    id: 'goddess', name: 'Utkata Konasana (Goddess Pose)', level: 'intermediate', focusAreas: ['strength', 'legs'],
    bodyPartsAffected: { stretched: ['hips', 'groin'], strengthened: ['quadriceps', 'glutes', 'calves'] },
    benefits: 'A wide-legged squat that builds lower-body strength and stamina while opening the hips and groin.',
    steps: [
      'Step your feet wide apart, toes turned out roughly 45 degrees.',
      'Bend your knees and sink your hips down into a wide squat, tracking knees over toes.',
      'Raise your arms out to the sides and bend your elbows to 90 degrees, palms facing forward.',
      'Hold for 5-8 breaths, keeping your spine tall and core engaged.'
    ]
  },
  {
    id: 'chair', name: 'Utkatasana (Chair Pose)', level: 'intermediate', focusAreas: ['strength', 'legs'],
    bodyPartsAffected: { stretched: ['shoulders'], strengthened: ['quadriceps', 'glutes', 'core'] },
    benefits: 'Builds significant quad and glute strength — often described as a standing squat with an overhead reach.',
    steps: [
      'Stand with feet together or hip-width apart.',
      'Bend your knees and sit your hips back as if sitting in a chair.',
      'Raise your arms overhead, keeping your weight in your heels.',
      'Hold for 5-8 breaths, keeping your chest lifted.'
    ]
  },
  {
    id: 'corpse', name: 'Savasana (Corpse Pose)', level: 'beginner', focusAreas: ['stress_relief', 'recovery'],
    bodyPartsAffected: { stretched: [], strengthened: [] },
    benefits: 'Full-body relaxation pose used to close every yoga session — allows the nervous system to integrate the practice.',
    steps: [
      'Lie flat on your back, legs relaxed and slightly apart, arms at your sides with palms up.',
      'Close your eyes and let your entire body go heavy against the mat.',
      'Breathe naturally, releasing tension with every exhale.',
      'Stay for 3-5 minutes, then slowly transition back to sitting.'
    ]
  },
  {
    id: 'cat_cow', name: 'Marjaryasana-Bitilasana (Cat-Cow)', level: 'beginner', focusAreas: ['back', 'recovery'],
    bodyPartsAffected: { stretched: ['lower_back', 'abdominals'], strengthened: ['core'] },
    benefits: 'A gentle spinal mobility flow that warms up the back and relieves stiffness — ideal at the start of a session.',
    steps: [
      'Start on hands and knees, wrists under shoulders, knees under hips.',
      'Inhale, drop your belly and lift your chest and tailbone (Cow).',
      'Exhale, round your spine and tuck your chin and tailbone (Cat).',
      'Flow between the two for 8-10 breaths.'
    ]
  }
];

const FOCUS_LABELS = {
  full_body: 'Full Body', flexibility: 'Flexibility', strength: 'Strength & Stability',
  balance: 'Balance', back: 'Back & Spine', hips: 'Hips & Legs', core: 'Core',
  stress_relief: 'Stress Relief', recovery: 'Recovery', legs: 'Legs'
};

export function focusLabel(focusArea) {
  return FOCUS_LABELS[focusArea] || focusArea;
}
