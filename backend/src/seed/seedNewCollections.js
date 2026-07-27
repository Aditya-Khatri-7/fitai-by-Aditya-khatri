import mongoose from 'mongoose';
import dotenv from 'dotenv';
import YogaExercise from '../models/YogaExercise.js';
import MeditationSession from '../models/MeditationSession.js';
import RehabilitationExercise from '../models/RehabilitationExercise.js';
import MentalHealthMetric from '../models/MentalHealthMetric.js';
import FoodRecognitionCache from '../models/FoodRecognitionCache.js';
import BodyComposition from '../models/BodyComposition.js';

dotenv.config();

export async function seedNewCollections() {
  try {
    let mongoUri = process.env.MONGODB_URI;
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
      } catch (atlasErr) {
        console.log('[Seed Engine] MongoDB Atlas auth/IP restriction. Connecting to local fallback MongoDB...');
        mongoUri = 'mongodb://localhost:27017/fitai';
        await mongoose.connect(mongoUri);
      }
    }

    console.log('[Seed Engine] Seeding 6 new MongoDB collections...');

    // 1. Yoga Exercises
    await YogaExercise.deleteMany({});
    await YogaExercise.insertMany([
      { title: "Cat-Cow Stretch", sanskritName: "Marjaryasana-Bitilasana", category: "yoga", focusArea: ["Spine", "Core"], difficulty: "Beginner", pregnancySafe: true, seniorSafe: true, instructions: "Arch and round spine in tabletop.", benefits: "Spinal mobility." },
      { title: "Child's Pose", sanskritName: "Balasana", category: "restorative", focusArea: ["Hips", "Back"], difficulty: "Beginner", pregnancySafe: true, seniorSafe: true, instructions: "Rest forehead on floor kneeling.", benefits: "Stress relief." }
    ]);

    // 2. Meditation Sessions
    await MeditationSession.deleteMany({});
    await MeditationSession.insertMany([
      { title: "4-7-8 Parasympathetic Breathing", category: "breathing", durationMins: 5, focusArea: "Stress Reduction", instructions: "Inhale 4s, hold 7s, exhale 8s." },
      { title: "Body Scan Mindfulness", category: "body_scan", durationMins: 10, focusArea: "Sleep Quality", instructions: "Conscious awareness of body parts." }
    ]);

    // 3. Rehabilitation Exercises
    await RehabilitationExercise.deleteMany({});
    await RehabilitationExercise.insertMany([
      { title: "Quad Setting Iso-Contraction", jointFocus: "knee", phase: "Post-Op Phase 1", instructions: "Tighten quad pushing knee down.", clinicalNotes: "ACL rehabilitation safe." }
    ]);

    // 4. Mental Health Metrics
    await MentalHealthMetric.deleteMany({});
    await MentalHealthMetric.insertMany([
      { stressIndex: 28, mood: "Calm", anxietyLevel: 2, mindfulnessMinutes: 15 }
    ]);

    // 5. Food Recognition Cache
    await FoodRecognitionCache.deleteMany({});
    await FoodRecognitionCache.insertMany([
      { imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", detectedFoodName: "Grilled Chicken Bowl", confidence: 0.94, caloriesEstimated: 520, proteinGrams: 46, carbsGrams: 48, fatGrams: 16 }
    ]);

    // 6. Body Composition
    await BodyComposition.deleteMany({});
    await BodyComposition.insertMany([
      { bodyFatPercentage: 16.5, leanMassKg: 65.9, bmi: 22.8, fitnessScore: 84 }
    ]);

    console.log('[Seed Engine] Successfully seeded Yoga, Meditation, Rehab, MentalHealth, FoodCache, and BodyComposition collections!');
  } catch (err) {
    console.warn(`[Seed Warning] Could not seed collections: ${err.message}`);
  }
}

if (process.argv[2] === '--run') {
  seedNewCollections().then(() => process.exit(0));
}
