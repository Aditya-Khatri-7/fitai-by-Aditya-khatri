import HealthMetric from '../models/HealthMetric.js';

export async function syncWearableData(req, res) {
  try {
    const { source, heartRate, sleep, steps, caloriesBurned, hydration, stress, soreness, weight, bloodPressure, bloodSugar } = req.body;

    const metric = await HealthMetric.create({
      userId: req.user._id,
      source: source === 'manual' ? 'manual' : 'wearable_sync',
      heartRate,
      sleep,
      steps,
      caloriesBurned,
      hydration,
      stress,
      soreness,
      weight,
      bloodPressure,
      bloodSugar
    });

    res.status(201).json(metric);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
