import mongoose from 'mongoose';

const GoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: String,
  targetValue: Number,
  startValue: Number,
  currentValue: Number,
  unit: String,
  startDate: { type: Date, default: Date.now },
  deadline: Date,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Goal', GoalSchema);
