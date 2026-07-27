import mongoose from 'mongoose';

const HealthMetricSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  source: { type: String, enum: ['manual', 'fitband_sim', 'watch_sim', 'wearable_sync'], default: 'watch_sim' },

  heartRate: {
    resting: Number,
    active: Number,
    max: Number
  },
  sleep: {
    duration: Number,
    quality: Number,
    deepSleep: Number,
    remSleep: Number,
    lightSleep: Number
  },
  steps: Number,
  caloriesBurned: Number,
  hydration: Number,
  stress: Number,
  soreness: {
    level: Number,
    bodyParts: [String]
  },
  weight: Number,
  bloodPressure: {
    systolic: Number,
    diastolic: Number
  },
  bloodSugar: Number
}, { timestamps: true });

export default mongoose.model('HealthMetric', HealthMetricSchema);
