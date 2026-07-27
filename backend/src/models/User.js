import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80' },

  profile: {
    age: Number,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    height: Number,
    weight: Number,
    bodyFatPercentage: Number,
    fitnessLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'athlete'], default: 'intermediate' },
    activityLevel: { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'], default: 'moderate' }
  },

  healthProfile: {
    chronicConditions: [{
      condition: { type: String },
      severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
      medications: [String],
      restrictions: [String],
      diagnosedDate: Date
    }],
    allergies: [String],
    bloodType: String
  },

  injuries: [{
    bodyPart: { type: String },
    type: { type: String },
    severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
    dateReported: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    restrictions: [String],
    expectedRecoveryDate: Date
  }],

  equipment: [String],

  preferences: {
    workoutDuration: { type: Number, default: 45 },
    workoutLocation: { type: String, enum: ['gym', 'home', 'outdoor', 'hotel'], default: 'gym' },
    dietType: { type: String, default: 'omnivore' },
    budget: { type: String, default: 'medium' },
    cookingSkill: { type: String, default: 'intermediate' },
    country: String,
    religion: String
  },

  currentGoal: {
    type: { type: String, default: 'muscle_gain' },
    targetValue: Number,
    startValue: Number,
    unit: String,
    startDate: Date,
    deadline: Date
  },

  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastWorkoutDate: Date
  },

  onboardingCompleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
