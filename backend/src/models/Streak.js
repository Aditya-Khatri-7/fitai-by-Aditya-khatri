import mongoose from 'mongoose';

const StreakSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  streakDates: [Date]
}, { timestamps: true });

export default mongoose.model('Streak', StreakSchema);
