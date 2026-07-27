import mongoose from 'mongoose';

const RehabilitationExerciseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  jointFocus: { type: String, enum: ['knee', 'shoulder', 'spine', 'hip', 'ankle', 'wrist'] },
  phase: String,
  instructions: String,
  contraindications: [String],
  clinicalNotes: String
}, { timestamps: true });

export default mongoose.model('RehabilitationExercise', RehabilitationExerciseSchema);
