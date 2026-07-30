import mongoose from 'mongoose';

const MLPredictionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  predictionType: {
    type: String,
    enum: [
      'recovery', 'injury', 'recommendation',
      'bodyfat', 'diabetes_risk', 'cardio_risk',
      'meal_recommendation', 'meditation_recommendation', 'rehab_recommendation',
      'stress_level', 'activity_recognition', 'yoga_pose', 'meal_photo'
    ],
    required: true
  },
  input: mongoose.Schema.Types.Mixed,
  output: mongoose.Schema.Types.Mixed,
  modelVersion: { type: String, default: 'v2.0' },
  latencyMs: Number
}, { timestamps: true });

export default mongoose.model('MLPrediction', MLPredictionSchema);
