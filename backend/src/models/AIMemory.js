import mongoose from 'mongoose';

const AIMemorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
  eventType: {
    type: String,
    enum: ['goal_change', 'injury_reported', 'injury_recovered', 'milestone_reached', 'habit_detected', 'workout_pattern', 'recovery_alert', 'chronic_condition_update', 'equipment_change', 'weight_change']
  },
  title: String,
  details: String,
  context: mongoose.Schema.Types.Mixed,
  aiNotes: String
}, { timestamps: true });

export default mongoose.model('AIMemory', AIMemorySchema);
