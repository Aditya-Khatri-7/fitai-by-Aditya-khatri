import mongoose from 'mongoose';

const WorkoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  version: { type: Number, default: 1 },
  title: String,
  type: { type: String, enum: ['strength', 'cardio', 'hiit', 'flexibility', 'recovery', 'mixed'], default: 'strength' },
  splitFocus: String,
  durationTarget: Number,

  exercises: [{
    exerciseId: String,
    name: String,
    muscleGroups: { primary: [String], secondary: [String] },
    sets: Number,
    reps: String,
    weight: String,
    restTime: Number,
    equipment: String,
    isAISwapped: { type: Boolean, default: false },
    swapReason: String,
    originalExercise: String,
    notes: String
  }],

  aiGenerated: { type: Boolean, default: true },
  aiExplanation: String,
  recoveryScoreAtGeneration: Number,
  status: { type: String, enum: ['planned', 'in_progress', 'completed', 'skipped', 'modified'], default: 'planned' },
  caloriesBurned: Number
}, { timestamps: true });

export default mongoose.model('Workout', WorkoutSchema);
