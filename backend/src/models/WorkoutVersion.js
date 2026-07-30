import mongoose from 'mongoose';

const WorkoutVersionSchema = new mongoose.Schema({
  workoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  version: Number,
  changes: String,
  reason: { type: String, enum: ['ai_adaptation', 'injury_detected', 'goal_change', 'user_override', 'recovery_low', 'equipment_change'] },
  exercisesSnapshot: [mongoose.Schema.Types.Mixed],
  // Full workout fields at this version (title/splitFocus/durationTarget/type) —
  // exercisesSnapshot alone isn't enough to restore a complete workout without
  // wiping out everything else on the document.
  workoutSnapshot: mongoose.Schema.Types.Mixed,
  previousVersion: Number,
  aiExplanation: String
}, { timestamps: true });

export default mongoose.model('WorkoutVersion', WorkoutVersionSchema);
