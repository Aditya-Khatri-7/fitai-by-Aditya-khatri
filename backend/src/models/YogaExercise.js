import mongoose from 'mongoose';

const YogaExerciseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  sanskritName: String,
  category: { type: String, enum: ['hatha', 'vinyasa', 'yin', 'restorative', 'yoga'], default: 'yoga' },
  focusArea: [String],
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  pregnancySafe: { type: Boolean, default: true },
  seniorSafe: { type: Boolean, default: true },
  instructions: String,
  benefits: String
}, { timestamps: true });

export default mongoose.model('YogaExercise', YogaExerciseSchema);
