import HealthUpdate from '../models/HealthUpdate.js';
import User from '../models/User.js';
import AIMemory from '../models/AIMemory.js';
import HealthMetric from '../models/HealthMetric.js';
import { predictRecovery, predictInjury, recommendExercises } from '../services/mlClient.js';

export async function processHealthUpdate(req, res) {
  try {
    const { updateType, bodyPart, severity, recoveryEstimate, restrictions, doctorNotes } = req.body;
    const userId = req.user._id;

    // 1. Create HealthUpdate audit document
    const healthUpdateDoc = await HealthUpdate.create({
      userId,
      updateType,
      bodyPart,
      severity,
      recoveryEstimate: recoveryEstimate || 21,
      restrictions: restrictions || ['Avoid heavy joint loading'],
      doctorNotes,
      aiAdaptationSummary: `AI adjusted training plan to accommodate ${updateType} on ${bodyPart || 'affected area'}.`
    });

    // 2. Update User Document active injuries / healthProfile
    if (bodyPart) {
      await User.findByIdAndUpdate(userId, {
        $push: {
          injuries: {
            bodyPart,
            type: updateType,
            severity: severity || 'moderate',
            isActive: true,
            restrictions: restrictions || ['Avoid heavy joint loading']
          }
        }
      });
    }

    // 3. Log AIMemory Event
    await AIMemory.create({
      userId,
      eventType: 'chronic_condition_update',
      title: `${updateType.toUpperCase()}: ${bodyPart || 'Health Status Update'}`,
      details: `User reported ${updateType} (${severity || 'moderate'}). AI applied biomechanical protection rules.`
    });

    res.status(201).json({
      success: true,
      message: 'Health status updated! Workouts and meal plans adapted by AI.',
      healthUpdate: healthUpdateDoc
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getHealthMetricRange(req, res) {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: 'Query params "from" and "to" (YYYY-MM-DD) are required.' });
    }
    const metrics = await HealthMetric.find({
      userId: req.user._id,
      date: { $gte: new Date(from), $lte: new Date(new Date(to).setHours(23, 59, 59, 999)) }
    }).sort({ date: 1 });
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getHealthSnapshot(req, res) {
  try {
    const userId = req.user._id;

    const [latestMetric, recentMemories] = await Promise.all([
      HealthMetric.findOne({ userId }).sort({ date: -1 }),
      AIMemory.find({ userId }).sort({ timestamp: -1 }).limit(10)
    ]);

    res.json({
      todayMetrics: latestMetric || null,
      injuries: req.user.injuries || [],
      chronicConditions: req.user.healthProfile?.chronicConditions || [],
      aiMemories: recentMemories
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
