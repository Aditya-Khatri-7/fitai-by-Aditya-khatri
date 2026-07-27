import mongoose from 'mongoose';

const MeditationSessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, enum: ['mindfulness', 'breathing', 'body_scan', 'sleep', 'stress_reduction'], default: 'mindfulness' },
  durationMins: Number,
  focusArea: String,
  instructions: String,
  audioUrl: String
}, { timestamps: true });

export default mongoose.model('MeditationSession', MeditationSessionSchema);
