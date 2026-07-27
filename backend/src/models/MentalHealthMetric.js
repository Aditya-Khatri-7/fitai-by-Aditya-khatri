import mongoose from 'mongoose';

const MentalHealthMetricSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  stressIndex: Number,
  mood: String,
  anxietyLevel: Number,
  mindfulnessMinutes: Number
}, { timestamps: true });

export default mongoose.model('MentalHealthMetric', MentalHealthMetricSchema);
