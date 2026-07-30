import mongoose from 'mongoose';

const MealPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },

  meals: [{
    type: { type: String, enum: ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack', 'snack'] },
    name: String,
    foods: [{
      name: String,
      quantity: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number
    }],
    totalCalories: Number,
    prepTime: Number,
    recipe: String,
    consumed: { type: Boolean, default: false },
    consumedAt: Date
  }],

  dailyTotals: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },

  targetCalories: Number,
  chronicConditionAdjustments: [{ condition: String, adjustment: String }],
  aiGenerated: { type: Boolean, default: true },
  aiExplanation: String,
  isCheatDay: { type: Boolean, default: false },
  cheatMessage: String
}, { timestamps: true });

export default mongoose.model('MealPlan', MealPlanSchema);
