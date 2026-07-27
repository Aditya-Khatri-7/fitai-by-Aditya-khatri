import { extractHealthProfileFromText } from '../services/medicalExtractionService.js';

export async function extractHealthIntake(req, res) {
  try {
    const { text, priorAnswers } = req.body;
    const result = await extractHealthProfileFromText(text, priorAnswers);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function confirmHealthIntake(req, res) {
  try {
    const { conditions, updateType } = req.body;
    const user = req.user;

    if (!Array.isArray(conditions)) {
      return res.status(400).json({ message: 'conditions array is required' });
    }

    const chronicTypes = ['chronic_condition', 'medication'];
    const isChronic = chronicTypes.includes(updateType);

    if (isChronic) {
      const newChronic = conditions.map(c => ({
        condition: c.condition,
        severity: c.severity || 'moderate',
        medications: c.medications || [],
        restrictions: c.doctorRestrictions || [],
        diagnosedDate: new Date()
      }));
      user.healthProfile.chronicConditions = [...(user.healthProfile.chronicConditions || []), ...newChronic];
    } else {
      const newInjuries = conditions.map(c => ({
        bodyPart: c.bodyPart || 'unspecified',
        type: updateType || 'injury',
        severity: c.severity || 'moderate',
        dateReported: new Date(),
        isActive: updateType !== 'recovery',
        restrictions: c.doctorRestrictions || []
      }));
      user.injuries = [...(user.injuries || []), ...newInjuries];
    }

    await user.save();
    res.json({ user: user.toObject ? { ...user.toObject(), password: undefined } : user, appliedConditions: conditions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
