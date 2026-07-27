export const APP_NAME = 'FitAI';
export const APP_SLOGAN = 'AI-Powered Adaptive Fitness Intelligence';

export const CHRONIC_CONDITIONS_LIST = [
  { id: 'hypertension', name: 'Hypertension (High Blood Pressure)', description: 'Requires DASH dietary guidelines (< 2000mg sodium) and avoidance of heavy Valsalva maneuvers.' },
  { id: 'diabetes_type2', name: 'Type 2 Diabetes', description: 'Requires low glycemic index meal timing and steady aerobic glucose utilization.' },
  { id: 'diabetes_type1', name: 'Type 1 Diabetes', description: 'Requires intra-workout carb monitoring and precise insulin timing.' },
  { id: 'asthma', name: 'Asthma', description: 'Requires extended warm-up sets and humidity/temperature monitoring.' },
  { id: 'arthritis', name: 'Arthritis', description: 'Requires low-impact joint movements and warm joint lubrications.' },
  { id: 'heart_disease', name: 'Cardiovascular Disease', description: 'Requires strict HR zone monitoring under medical caps.' },
  { id: 'pcos', name: 'PCOS', description: 'Requires anti-inflammatory insulin-sensitizing nutritional balance.' }
];

export const GOAL_TYPES = [
  { id: 'weight_loss', label: 'Weight Loss & Fat Burn', icon: 'Flame', description: 'Caloric deficit, metabolic conditioning, and lean tissue preservation.' },
  { id: 'muscle_gain', label: 'Hypertrophy & Muscle Gain', icon: 'Dumbbell', description: 'Progressive overload, high protein synthesis, and targeted split workouts.' },
  { id: 'endurance', label: 'Stamina & Cardiovascular Endurance', icon: 'Activity', description: 'Aerobic threshold training, VO2 max optimization, and stamina build.' },
  { id: 'marathon', label: 'Marathon / Race Prep', icon: 'Trophy', description: 'Long distance pacing, joint resilience, and energy periodization.' },
  { id: 'flexibility', label: 'Flexibility & Mobility (Yoga)', icon: 'Sun', description: 'Joint range of motion, posture correction, and active recovery.' },
  { id: 'rehabilitation', label: 'Post-Surgery & Joint Rehabilitation', icon: 'ShieldCheck', description: 'Targeted strengthening of joint stabilizers under strict safety constraints.' }
];

export const WORKOUT_CATEGORIES = [
  'Strength',
  'Recovery Workouts',
  'Post Surgery Recovery Plans',
  'Joint Friendly Exercises',
  'Stretching Library',
  'Warm-up Library',
  'Cool-down Library'
];
