import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function seedDemoUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitai';
    console.log(`[SeedScript] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    const salt = await bcrypt.genSalt(10);
    const pass1 = await bcrypt.hash('FitAI@Demo1', salt);
    const pass2 = await bcrypt.hash('FitAI@Demo2', salt);
    const pass3 = await bcrypt.hash('FitAI@Demo3', salt);
    const pass4 = await bcrypt.hash('FitAI@Demo4', salt);

    const usersData = [
      {
        name: 'Raj Sharma',
        email: 'raj@fitai.demo',
        password: pass1,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=raj',
        profile: {
          age: 26,
          gender: 'male',
          height: 178,
          weight: 84,
          bodyFatPercentage: 18,
          fitnessLevel: 'intermediate',
          activityLevel: 'active'
        },
        healthProfile: {
          chronicConditions: [],
          allergies: [],
          bloodType: 'B+'
        },
        injuries: [
          {
            bodyPart: 'knee',
            type: 'pain',
            severity: 'moderate',
            dateReported: new Date('2026-06-15'),
            isActive: true,
            restrictions: ['No deep squats', 'No heavy leg press', 'Avoid high-impact jumps']
          }
        ],
        equipment: ['barbell', 'dumbbell', 'cable', 'machine', 'rack', 'bench'],
        preferences: {
          workoutDuration: 50,
          workoutLocation: 'gym',
          dietType: 'omnivore',
          budget: 'medium',
          cookingSkill: 'intermediate',
          country: 'India'
        },
        currentGoal: {
          type: 'muscle_gain',
          targetValue: 90,
          startValue: 84,
          unit: 'kg',
          startDate: new Date('2026-05-01'),
          deadline: new Date('2026-10-01')
        },
        streak: { current: 14, longest: 21, lastWorkoutDate: new Date() },
        onboardingCompleted: true
      },
      {
        name: 'Priya Verma',
        email: 'priya@fitai.demo',
        password: pass2,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
        profile: {
          age: 34,
          gender: 'female',
          height: 163,
          weight: 72,
          bodyFatPercentage: 28,
          fitnessLevel: 'beginner',
          activityLevel: 'light'
        },
        healthProfile: {
          chronicConditions: [
            {
              condition: 'hypertension',
              severity: 'moderate',
              medications: ['Amlodipine 5mg', 'Losartan 50mg'],
              restrictions: ['No Valsalva maneuver', 'Limit max HR to 140 BPM', 'No isometric holds >3 seconds'],
              diagnosedDate: new Date('2024-03-10')
            }
          ],
          allergies: ['lactose'],
          bloodType: 'O+'
        },
        injuries: [],
        equipment: ['dumbbell', 'resistance_band', 'pull_up_bar'],
        preferences: {
          workoutDuration: 30,
          workoutLocation: 'home',
          dietType: 'vegetarian',
          budget: 'low',
          cookingSkill: 'beginner',
          country: 'India'
        },
        currentGoal: {
          type: 'weight_loss',
          targetValue: 64,
          startValue: 72,
          unit: 'kg',
          startDate: new Date('2026-06-01'),
          deadline: new Date('2026-12-01')
        },
        streak: { current: 6, longest: 12, lastWorkoutDate: new Date() },
        onboardingCompleted: true
      },
      {
        name: 'Test User',
        email: 'test@fitai.demo',
        password: pass3,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
        onboardingCompleted: false
      },
      {
        name: 'Arjun Mehta',
        email: 'arjun@fitai.demo',
        password: pass4,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=arjun',
        profile: {
          age: 29,
          gender: 'male',
          height: 175,
          weight: 68,
          bodyFatPercentage: 11,
          fitnessLevel: 'advanced',
          activityLevel: 'very_active'
        },
        healthProfile: {
          chronicConditions: [],
          allergies: [],
          bloodType: 'A+'
        },
        injuries: [],
        equipment: ['bodyweight_only', 'resistance_band'],
        preferences: {
          workoutDuration: 60,
          workoutLocation: 'outdoor',
          dietType: 'omnivore',
          budget: 'medium',
          cookingSkill: 'intermediate',
          country: 'India'
        },
        currentGoal: {
          type: 'marathon',
          targetValue: 42.2,
          startValue: 15,
          unit: 'km',
          startDate: new Date('2026-03-01'),
          deadline: new Date('2026-11-15')
        },
        streak: { current: 23, longest: 30, lastWorkoutDate: new Date() },
        onboardingCompleted: true
      }
    ];

    for (const u of usersData) {
      await User.findOneAndUpdate({ email: u.email }, u, { upsert: true, new: true });
      console.log(`[SeedScript] Seeded/Updated user: ${u.email}`);
    }

    console.log('[SeedScript] Demo users seeding finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[SeedScript] Error seeding demo users:', err);
    process.exit(1);
  }
}

seedDemoUsers();
