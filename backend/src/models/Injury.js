import mongoose from 'mongoose';

const InjurySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bodyPart: String,
  type: String,
  severity: String,
  dateReported: { type: Date, default: Date.now },
  expectedRecoveryDate: Date,
  isActive: { type: Boolean, default: true },
  restrictions: [String],
  avoidExercises: [String],
  alternativeExercises: [String],
  aiRecommendations: String
}, { timestamps: true });

export default mongoose.model('Injury', InjurySchema);
