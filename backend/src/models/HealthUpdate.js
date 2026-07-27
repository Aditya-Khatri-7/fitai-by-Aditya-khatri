import mongoose from 'mongoose';

const HealthUpdateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updateType: {
    type: String,
    enum: ['surgery', 'injury', 'chronic_condition', 'recovery', 'medication', 'illness'],
    required: true
  },
  bodyPart: String,
  severity: String,
  eventDate: { type: Date, default: Date.now },
  recoveryEstimate: Number, // days
  restrictions: [String],
  allowedActivities: [String],
  medications: [String],
  medicalDocuments: [{ url: String, name: String, uploadedAt: { type: Date, default: Date.now } }],
  doctorNotes: String,
  aiAdaptationSummary: String,
  affectedWorkoutIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Workout' }],
  affectedMealPlanIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MealPlan' }],
  status: { type: String, enum: ['active', 'recovered', 'ongoing'], default: 'active' },
  resolvedAt: Date
}, { timestamps: true });

export default mongoose.model('HealthUpdate', HealthUpdateSchema);
