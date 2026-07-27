import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

// Three sample users distinct from the polished Raj/Priya/Test/Arjun demo-login
// accounts (seedDemoUsers.js) — for the user's own exploration of realistic, varied
// profiles: a true beginner, an intermediate lifter cutting weight, and an older user
// managing a chronic condition.
async function seedSampleUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitai';
    console.log(`[SeedScript] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    const salt = await bcrypt.genSalt(10);
    const pass1 = await bcrypt.hash('FitAI@Sample1', salt);
    const pass2 = await bcrypt.hash('FitAI@Sample2', salt);
    const pass3 = await bcrypt.hash('FitAI@Sample3', salt);

    const usersData = [
      {
        name: 'Meera Iyer',
        email: 'meera.sample@fitai.demo',
        password: pass1,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=meera',
        profile: {
          age: 22,
          gender: 'female',
          height: 160,
          weight: 58,
          bodyFatPercentage: 26,
          fitnessLevel: 'beginner',
          activityLevel: 'sedentary'
        },
        healthProfile: {
          chronicConditions: [],
          allergies: ['peanuts'],
          bloodType: 'A-'
        },
        injuries: [],
        equipment: ['bodyweight_only', 'resistance_band'],
        preferences: {
          workoutDuration: 25,
          workoutLocation: 'home',
          dietType: 'vegetarian',
          budget: 'low',
          cookingSkill: 'beginner',
          country: 'India'
        },
        currentGoal: {
          type: 'general_fitness',
          targetValue: 65,
          startValue: 58,
          unit: 'kg',
          startDate: new Date('2026-07-01'),
          deadline: new Date('2027-01-01')
        },
        streak: { current: 3, longest: 5, lastWorkoutDate: new Date() },
        onboardingCompleted: true
      },
      {
        name: 'Vikram Rao',
        email: 'vikram.sample@fitai.demo',
        password: pass2,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vikram',
        profile: {
          age: 31,
          gender: 'male',
          height: 180,
          weight: 92,
          bodyFatPercentage: 24,
          fitnessLevel: 'intermediate',
          activityLevel: 'moderate'
        },
        healthProfile: {
          chronicConditions: [],
          allergies: [],
          bloodType: 'B-'
        },
        injuries: [
          {
            bodyPart: 'lower_back',
            type: 'strain',
            severity: 'mild',
            dateReported: new Date('2026-05-20'),
            isActive: true,
            restrictions: ['No conventional deadlifts', 'Keep spine neutral under load']
          }
        ],
        equipment: ['barbell', 'dumbbell', 'cable', 'machine', 'bench'],
        preferences: {
          workoutDuration: 55,
          workoutLocation: 'gym',
          dietType: 'omnivore',
          budget: 'medium',
          cookingSkill: 'intermediate',
          country: 'India'
        },
        currentGoal: {
          type: 'weight_loss',
          targetValue: 82,
          startValue: 92,
          unit: 'kg',
          startDate: new Date('2026-06-15'),
          deadline: new Date('2027-02-15')
        },
        streak: { current: 9, longest: 18, lastWorkoutDate: new Date() },
        onboardingCompleted: true
      },
      {
        name: 'Sunita Desai',
        email: 'sunita.sample@fitai.demo',
        password: pass3,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunita',
        profile: {
          age: 52,
          gender: 'female',
          height: 155,
          weight: 70,
          bodyFatPercentage: 33,
          fitnessLevel: 'beginner',
          activityLevel: 'light'
        },
        healthProfile: {
          chronicConditions: [
            {
              condition: 'type_2_diabetes',
              severity: 'moderate',
              medications: ['Metformin 500mg'],
              restrictions: ['Avoid high-glycemic post-workout meals', 'Monitor blood sugar before/after exercise'],
              diagnosedDate: new Date('2022-01-15')
            }
          ],
          allergies: [],
          bloodType: 'AB+'
        },
        injuries: [],
        equipment: ['resistance_band', 'bodyweight_only'],
        preferences: {
          workoutDuration: 30,
          workoutLocation: 'home',
          dietType: 'vegetarian',
          budget: 'medium',
          cookingSkill: 'intermediate',
          country: 'India'
        },
        currentGoal: {
          type: 'general_fitness',
          targetValue: 65,
          startValue: 70,
          unit: 'kg',
          startDate: new Date('2026-06-01'),
          deadline: new Date('2027-03-01')
        },
        streak: { current: 5, longest: 9, lastWorkoutDate: new Date() },
        onboardingCompleted: true
      }
    ];

    for (const u of usersData) {
      await User.findOneAndUpdate({ email: u.email }, u, { upsert: true, new: true });
      console.log(`[SeedScript] Seeded/Updated sample user: ${u.email}`);
    }

    console.log('[SeedScript] Sample users seeding finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[SeedScript] Error seeding sample users:', err);
    process.exit(1);
  }
}

seedSampleUsers();
