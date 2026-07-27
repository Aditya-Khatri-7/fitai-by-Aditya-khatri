import mongoose from 'mongoose';

const MLPredictionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  predictionType: { type: String, enum: ['recovery', 'injury', 'recommendation'], required: true },
  input: mongoose.Schema.Types.Mixed,
  output: mongoose.Schema.Types.Mixed,
  modelVersion: { type: String, default: 'v2.0' },
  latencyMs: Number
}, { timestamps: true });

export default mongoose.model('MLPrediction', MLPredictionSchema);
