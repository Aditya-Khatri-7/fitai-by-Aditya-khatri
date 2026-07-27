import mongoose from 'mongoose';

const FoodRecognitionCacheSchema = new mongoose.Schema({
  imageUrl: String,
  detectedFoodName: String,
  confidence: Number,
  caloriesEstimated: Number,
  proteinGrams: Number,
  carbsGrams: Number,
  fatGrams: Number
}, { timestamps: true });

export default mongoose.model('FoodRecognitionCache', FoodRecognitionCacheSchema);
