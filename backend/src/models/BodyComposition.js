import mongoose from 'mongoose';

const BodyCompositionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  bodyFatPercentage: Number,
  leanMassKg: Number,
  bmi: Number,
  fitnessScore: Number
}, { timestamps: true });

export default mongoose.model('BodyComposition', BodyCompositionSchema);
