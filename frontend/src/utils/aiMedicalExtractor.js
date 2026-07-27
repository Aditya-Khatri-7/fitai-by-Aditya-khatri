import conditionsCatalog from '../data/conditionsList.json';

export function parseHealthTextAI(text = '', selectedConditions = [], painLevel = 0, selectedBodyParts = []) {
  const lower = text.toLowerCase();
  const extractedConditions = [];
  const followUpQuestions = [];
  let riskScore = 0;

  // 1. Process selected autocomplete / chip conditions
  selectedConditions.forEach(cond => {
    const name = typeof cond === 'string' ? cond : cond.name;
    const bodyPart = typeof cond === 'object' ? cond.bodyPart : 'general';
    
    extractedConditions.push({
      name,
      bodyPart,
      side: lower.includes('left') ? 'left' : lower.includes('right') ? 'right' : 'bilateral',
      severity: painLevel > 6 ? 'severe' : painLevel > 3 ? 'moderate' : 'mild',
      painLevel,
      recoveryStage: lower.includes('surgery') || lower.includes('rehab') ? 'recovering' : 'active',
      doctorRestrictions: generateRestrictions(name),
      avoidExercises: generateAvoidList(name),
      recommendedExercises: generateRecommendList(name)
    });
    riskScore += 2;
  });

  // 2. Extract semantic conditions from free text / voice transcript
  if (lower.includes('acl') || lower.includes('knee')) {
    if (!extractedConditions.some(c => c.name.includes('ACL') || c.name.includes('Knee'))) {
      const isACL = lower.includes('acl');
      extractedConditions.push({
        name: isACL ? 'ACL Reconstruction / Tear' : 'Active Knee Strain',
        bodyPart: 'knee',
        side: lower.includes('right') ? 'right' : lower.includes('left') ? 'left' : 'bilateral',
        severity: painLevel > 5 ? 'severe' : 'moderate',
        painLevel: painLevel || 4,
        recoveryStage: lower.includes('surgery') ? 'post-surgery' : 'recovering',
        doctorRestrictions: ['No deep squats', 'No jumping', 'No heavy axial loading'],
        avoidExercises: ['Barbell Squats', 'Walking Lunges', 'Box Jumps'],
        recommendedExercises: ['Seated Machine Leg Extension', 'Seated Leg Press', 'Glute Bridges']
      });
      riskScore += 3;

      if (!lower.includes('left') && !lower.includes('right')) {
        followUpQuestions.push({ id: 'side', question: 'Which knee is affected?', options: ['Left Knee', 'Right Knee', 'Both Knees'] });
      }
      if (!lower.includes('surgery') && isACL) {
        followUpQuestions.push({ id: 'surgery', question: 'Was ACL surgery performed?', options: ['Yes', 'No'] });
      }
    }
  }

  if (lower.includes('shoulder') || lower.includes('rotator') || lower.includes('cuff')) {
    if (!extractedConditions.some(c => c.name.toLowerCase().includes('shoulder'))) {
      extractedConditions.push({
        name: 'Shoulder Impingement / Strain',
        bodyPart: 'shoulder',
        side: lower.includes('right') ? 'right' : lower.includes('left') ? 'left' : 'bilateral',
        severity: painLevel > 5 ? 'severe' : 'moderate',
        painLevel: painLevel || 5,
        recoveryStage: 'active',
        doctorRestrictions: ['No heavy overhead pressing', 'Avoid internal rotation under load'],
        avoidExercises: ['Overhead Barbell Press', 'Behind-Neck Pulldowns', 'Heavy Dips'],
        recommendedExercises: ['Lateral Dumbbell Raises (Light)', 'Cable Face Pulls', 'Chest Press']
      });
      riskScore += 2;

      if (!lower.includes('left') && !lower.includes('right')) {
        followUpQuestions.push({ id: 'side_shoulder', question: 'Which shoulder is affected?', options: ['Left Shoulder', 'Right Shoulder', 'Both Shoulders'] });
      }
    }
  }

  if (lower.includes('back') || lower.includes('disc') || lower.includes('sciatica')) {
    if (!extractedConditions.some(c => c.name.toLowerCase().includes('back') || c.name.toLowerCase().includes('disc'))) {
      extractedConditions.push({
        name: lower.includes('disc') ? 'Lumbar Disc Bulge / Herniation' : 'Lower Back Lumbar Strain',
        bodyPart: 'lower_back',
        side: 'central',
        severity: painLevel > 6 ? 'severe' : 'moderate',
        painLevel: painLevel || 5,
        recoveryStage: 'active',
        doctorRestrictions: ['Zero spinal loading', 'No spinal flexion under load'],
        avoidExercises: ['Barbell Deadlifts', 'Barbell Back Squats', 'Bent-Over Barbell Rows'],
        recommendedExercises: ['Chest-Supported Machine Rows', 'Lat Pulldowns', 'Bird-Dog / Planks']
      });
      riskScore += 3;
    }
  }

  if (lower.includes('hypertension') || lower.includes('high bp') || lower.includes('blood pressure')) {
    if (!extractedConditions.some(c => c.name.toLowerCase().includes('hypertension'))) {
      extractedConditions.push({
        name: 'Hypertension (High BP)',
        bodyPart: 'cardiovascular',
        side: 'systemic',
        severity: 'moderate',
        painLevel: 0,
        recoveryStage: 'chronic',
        doctorRestrictions: ['Limit Max HR to 140 BPM', 'No heavy Valsalva breath holding'],
        avoidExercises: ['1RM Heavy Lift Attempts', 'Heavy Overhead Isometric Holds'],
        recommendedExercises: ['Zone-2 Cardio', 'Submaximal Hypertrophy Sets (8-12 reps)']
      });
      riskScore += 2;
    }
  }

  // Fallback default if user provided input but no specific keywords triggered
  if (extractedConditions.length === 0 && (text.length > 5 || selectedBodyParts.length > 0)) {
    extractedConditions.push({
      name: 'Custom User Health Profile Scan',
      bodyPart: selectedBodyParts[0] || 'general',
      side: 'general',
      severity: painLevel > 5 ? 'moderate' : 'mild',
      painLevel,
      recoveryStage: 'active',
      doctorRestrictions: ['Maintain safe controlled range of motion'],
      avoidExercises: painLevel > 6 ? ['Heavy Barbell Compounds'] : [],
      recommendedExercises: ['Guided Machine Exercises', 'Submaximal Isolation Movements']
    });
  }

  const aiRiskLevel = riskScore >= 5 ? 'High' : riskScore >= 2 ? 'Medium' : 'Low';

  return {
    conditions: extractedConditions,
    followUpQuestions,
    aiRiskLevel
  };
}

function generateRestrictions(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('acl') || lower.includes('knee')) return ['No jumping', 'No deep squats', 'Avoid twisting'];
  if (lower.includes('shoulder')) return ['No overhead pressing', 'Avoid wide-grip dips'];
  if (lower.includes('back') || lower.includes('disc')) return ['Zero heavy deadlifts', 'Keep spine supported'];
  if (lower.includes('hypertension')) return ['Cap HR to 140 BPM', 'No 1RM max attempts'];
  return ['Maintain controlled tempo and stop if pain exceeds 4/10'];
}

function generateAvoidList(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('acl') || lower.includes('knee')) return ['Barbell Squats', 'Box Jumps', 'Walking Lunges'];
  if (lower.includes('shoulder')) return ['Overhead Barbell Press', 'Behind-Neck Pulldown'];
  if (lower.includes('back') || lower.includes('disc')) return ['Conventional Deadlifts', 'Barbell Back Squats'];
  return ['Heavy 1RM Lifts'];
}

function generateRecommendList(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('acl') || lower.includes('knee')) return ['Seated Leg Press', 'Leg Extension', 'Glute Bridges'];
  if (lower.includes('shoulder')) return ['Lateral Cable Raises', 'Chest Press', 'Face Pulls'];
  if (lower.includes('back') || lower.includes('disc')) return ['Chest-Supported Rows', 'Lat Pulldowns', 'Planks'];
  return ['Guided Machine Exercises'];
}
