/**
 * Seed script: two accounts
 *
 * 1. demo@fitai.app / FitDemo@2026
 *    Full veteran user — 14 days of workouts, meal plans, health metrics,
 *    body composition snapshots, gamification, streak. Simulates what a
 *    real user sees after a fortnight of usage.
 *
 * 2. newuser@fitai.app / NewUser@2026
 *    Blank account — onboardingCompleted: false, no profile data.
 *    Use this to walk through the onboarding flow fresh.
 *
 * Run: node --experimental-vm-modules src/scripts/seedFullDemoData.js
 * (or via npm script if package.json has "type":"module")
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import User from '../models/User.js';
import Workout from '../models/Workout.js';
import MealPlan from '../models/MealPlan.js';
import HealthMetric from '../models/HealthMetric.js';
import BodyComposition from '../models/BodyComposition.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

const rand = (min, max) => Math.round(min + Math.random() * (max - min));
const randF = (min, max, dp = 1) =>
  parseFloat((min + Math.random() * (max - min)).toFixed(dp));

// ─── workout templates ─────────────────────────────────────────────────────────

const WORKOUT_DAYS = [
  {
    title: 'Chest & Triceps Power',
    type: 'strength',
    splitFocus: 'Chest & Triceps',
    durationTarget: 55,
    caloriesBurned: 380,
    status: 'completed',
    aiExplanation: 'Heavy pressing focus with compound movements. Progressive overload on bench press to support hypertrophy goals.',
    exercises: [
      { name: 'Barbell Bench Press', muscleGroups: { primary: ['Chest'], secondary: ['Triceps', 'Front Delts'] }, sets: 4, reps: '6-8', weight: '80kg', restTime: 90, equipment: 'barbell' },
      { name: 'Incline Dumbbell Press', muscleGroups: { primary: ['Upper Chest'], secondary: ['Triceps'] }, sets: 3, reps: '8-10', weight: '28kg', restTime: 75, equipment: 'dumbbell' },
      { name: 'Cable Chest Fly', muscleGroups: { primary: ['Chest'], secondary: [] }, sets: 3, reps: '12-15', weight: '20kg', restTime: 60, equipment: 'cable' },
      { name: 'Close-Grip Bench Press', muscleGroups: { primary: ['Triceps'], secondary: ['Chest'] }, sets: 3, reps: '8-10', weight: '65kg', restTime: 75, equipment: 'barbell' },
      { name: 'Tricep Pushdown', muscleGroups: { primary: ['Triceps'], secondary: [] }, sets: 3, reps: '12-15', weight: '25kg', restTime: 60, equipment: 'cable' },
    ]
  },
  {
    title: 'Back & Biceps Hypertrophy',
    type: 'strength',
    splitFocus: 'Back & Biceps',
    durationTarget: 60,
    caloriesBurned: 420,
    status: 'completed',
    aiExplanation: 'Wide-grip pulling emphasis for V-taper development. Supination curls for bicep peak.',
    exercises: [
      { name: 'Weighted Pull-Ups', muscleGroups: { primary: ['Lats'], secondary: ['Biceps', 'Rhomboids'] }, sets: 4, reps: '6-8', weight: '+10kg', restTime: 90, equipment: 'pull_up_bar' },
      { name: 'Barbell Row', muscleGroups: { primary: ['Mid Back'], secondary: ['Biceps', 'Rear Delts'] }, sets: 4, reps: '8-10', weight: '75kg', restTime: 90, equipment: 'barbell' },
      { name: 'Seated Cable Row', muscleGroups: { primary: ['Mid Back'], secondary: ['Biceps'] }, sets: 3, reps: '10-12', weight: '60kg', restTime: 75, equipment: 'cable' },
      { name: 'Barbell Curl', muscleGroups: { primary: ['Biceps'], secondary: [] }, sets: 3, reps: '8-10', weight: '35kg', restTime: 75, equipment: 'barbell' },
      { name: 'Hammer Curl', muscleGroups: { primary: ['Brachialis'], secondary: ['Biceps'] }, sets: 3, reps: '10-12', weight: '16kg', restTime: 60, equipment: 'dumbbell' },
    ]
  },
  {
    title: 'Legs & Glutes Titan',
    type: 'strength',
    splitFocus: 'Quads, Hamstrings & Glutes',
    durationTarget: 65,
    caloriesBurned: 520,
    status: 'completed',
    aiExplanation: 'Heavy squat focus with RDL for posterior chain. High volume for lower body mass gain.',
    exercises: [
      { name: 'Barbell Back Squat', muscleGroups: { primary: ['Quadriceps'], secondary: ['Glutes', 'Hamstrings'] }, sets: 5, reps: '5-6', weight: '100kg', restTime: 120, equipment: 'barbell' },
      { name: 'Romanian Deadlift', muscleGroups: { primary: ['Hamstrings'], secondary: ['Glutes', 'Lower Back'] }, sets: 4, reps: '8-10', weight: '80kg', restTime: 90, equipment: 'barbell' },
      { name: 'Leg Press', muscleGroups: { primary: ['Quadriceps'], secondary: ['Glutes'] }, sets: 4, reps: '10-12', weight: '160kg', restTime: 90, equipment: 'machine' },
      { name: 'Bulgarian Split Squat', muscleGroups: { primary: ['Quadriceps'], secondary: ['Glutes'] }, sets: 3, reps: '10', weight: '20kg', restTime: 75, equipment: 'dumbbell' },
      { name: 'Standing Calf Raise', muscleGroups: { primary: ['Calves'], secondary: [] }, sets: 4, reps: '15-20', weight: '80kg', restTime: 60, equipment: 'machine' },
    ]
  },
  {
    title: 'Shoulders & Core Sculpt',
    type: 'strength',
    splitFocus: 'Shoulders & Core',
    durationTarget: 50,
    caloriesBurned: 340,
    status: 'completed',
    aiExplanation: 'Overhead pressing for shoulder width with lateral delts isolation. Core anti-rotation work.',
    exercises: [
      { name: 'Barbell Overhead Press', muscleGroups: { primary: ['Front Delts'], secondary: ['Triceps', 'Traps'] }, sets: 4, reps: '6-8', weight: '55kg', restTime: 90, equipment: 'barbell' },
      { name: 'Dumbbell Lateral Raise', muscleGroups: { primary: ['Lateral Delts'], secondary: [] }, sets: 4, reps: '12-15', weight: '10kg', restTime: 60, equipment: 'dumbbell' },
      { name: 'Face Pull', muscleGroups: { primary: ['Rear Delts'], secondary: ['External Rotators'] }, sets: 3, reps: '15-20', weight: '15kg', restTime: 60, equipment: 'cable' },
      { name: 'Pallof Press', muscleGroups: { primary: ['Core'], secondary: ['Obliques'] }, sets: 3, reps: '12', weight: '15kg', restTime: 60, equipment: 'cable' },
      { name: 'Ab Rollout', muscleGroups: { primary: ['Core'], secondary: ['Lats'] }, sets: 3, reps: '10', weight: 'BW', restTime: 60, equipment: 'barbell' },
    ]
  },
  {
    title: 'Active Recovery & Mobility',
    type: 'recovery',
    splitFocus: 'Full Body Mobility',
    durationTarget: 30,
    caloriesBurned: 120,
    status: 'completed',
    isCheatDay: true,
    cheatMessage: '🎉 Cheat Day! Light movement and enjoy some extra calories. Recovery is part of the gains.',
    aiExplanation: 'Scheduled cheat day. Light mobility work to keep joints supple without taxing the CNS.',
    exercises: [
      { name: 'Hip Flexor Stretch', muscleGroups: { primary: ['Hip Flexors'], secondary: [] }, sets: 3, reps: '45s hold', weight: 'BW', restTime: 30, equipment: 'bodyweight_only' },
      { name: 'Thoracic Rotation', muscleGroups: { primary: ['Thoracic Spine'], secondary: ['Core'] }, sets: 3, reps: '10 each side', weight: 'BW', restTime: 30, equipment: 'bodyweight_only' },
      { name: 'World Greatest Stretch', muscleGroups: { primary: ['Hip Flexors', 'Thoracic Spine'], secondary: ['Hamstrings'] }, sets: 3, reps: '8 each side', weight: 'BW', restTime: 30, equipment: 'bodyweight_only' },
    ]
  },
  {
    title: 'HIIT Power Circuit',
    type: 'hiit',
    splitFocus: 'Full Body HIIT',
    durationTarget: 40,
    caloriesBurned: 480,
    status: 'completed',
    aiExplanation: 'High-intensity circuit to boost metabolic rate and cardiovascular conditioning alongside strength training.',
    exercises: [
      { name: 'Kettlebell Swing', muscleGroups: { primary: ['Glutes', 'Hamstrings'], secondary: ['Core', 'Shoulders'] }, sets: 5, reps: '15', weight: '24kg', restTime: 45, equipment: 'dumbbell' },
      { name: 'Box Jump', muscleGroups: { primary: ['Quadriceps', 'Glutes'], secondary: ['Calves'] }, sets: 5, reps: '8', weight: 'BW', restTime: 45, equipment: 'bodyweight_only' },
      { name: 'Battle Rope Waves', muscleGroups: { primary: ['Shoulders', 'Core'], secondary: ['Arms'] }, sets: 5, reps: '30s', weight: 'BW', restTime: 30, equipment: 'machine' },
      { name: 'Medicine Ball Slam', muscleGroups: { primary: ['Core', 'Shoulders'], secondary: ['Lats'] }, sets: 4, reps: '12', weight: '10kg', restTime: 45, equipment: 'machine' },
    ]
  },
  {
    title: 'Push Day — Volume',
    type: 'strength',
    splitFocus: 'Chest, Shoulders & Triceps',
    durationTarget: 60,
    caloriesBurned: 400,
    status: 'completed',
    aiExplanation: 'High-volume push session focusing on time under tension for hypertrophy.',
    exercises: [
      { name: 'Incline Barbell Press', muscleGroups: { primary: ['Upper Chest'], secondary: ['Front Delts', 'Triceps'] }, sets: 4, reps: '8-10', weight: '70kg', restTime: 90, equipment: 'barbell' },
      { name: 'Flat Dumbbell Press', muscleGroups: { primary: ['Chest'], secondary: ['Triceps'] }, sets: 3, reps: '10-12', weight: '32kg', restTime: 75, equipment: 'dumbbell' },
      { name: 'Arnold Press', muscleGroups: { primary: ['Delts'], secondary: ['Triceps'] }, sets: 3, reps: '10-12', weight: '18kg', restTime: 75, equipment: 'dumbbell' },
      { name: 'Skull Crusher', muscleGroups: { primary: ['Triceps'], secondary: [] }, sets: 3, reps: '10-12', weight: '30kg', restTime: 60, equipment: 'barbell' },
      { name: 'Pec Deck', muscleGroups: { primary: ['Chest'], secondary: [] }, sets: 3, reps: '12-15', weight: '55kg', restTime: 60, equipment: 'machine' },
    ]
  },
  {
    title: 'Pull Day — Strength',
    type: 'strength',
    splitFocus: 'Back & Biceps',
    durationTarget: 60,
    caloriesBurned: 410,
    status: 'completed',
    aiExplanation: 'Strength-focused pull day with heavy deadlift variation. Superset bicep finisher.',
    exercises: [
      { name: 'Trap Bar Deadlift', muscleGroups: { primary: ['Hamstrings', 'Glutes'], secondary: ['Traps', 'Lats'] }, sets: 4, reps: '5', weight: '120kg', restTime: 120, equipment: 'barbell' },
      { name: 'Lat Pulldown', muscleGroups: { primary: ['Lats'], secondary: ['Biceps'] }, sets: 4, reps: '8-10', weight: '70kg', restTime: 75, equipment: 'cable' },
      { name: 'One-Arm Dumbbell Row', muscleGroups: { primary: ['Lats', 'Mid Back'], secondary: ['Biceps'] }, sets: 3, reps: '10', weight: '36kg', restTime: 75, equipment: 'dumbbell' },
      { name: 'EZ-Bar Curl', muscleGroups: { primary: ['Biceps'], secondary: [] }, sets: 3, reps: '10-12', weight: '32kg', restTime: 60, equipment: 'barbell' },
      { name: 'Face Pull', muscleGroups: { primary: ['Rear Delts'], secondary: ['External Rotators'] }, sets: 3, reps: '15', weight: '12kg', restTime: 60, equipment: 'cable' },
    ]
  },
  {
    title: 'Leg Day — Quad Focus',
    type: 'strength',
    splitFocus: 'Quadriceps & Calves',
    durationTarget: 60,
    caloriesBurned: 490,
    status: 'completed',
    aiExplanation: 'Quad-dominant session with front squat variation. High rep calf work for conditioning.',
    exercises: [
      { name: 'Front Squat', muscleGroups: { primary: ['Quadriceps'], secondary: ['Core', 'Upper Back'] }, sets: 4, reps: '6-8', weight: '75kg', restTime: 120, equipment: 'barbell' },
      { name: 'Hack Squat', muscleGroups: { primary: ['Quadriceps'], secondary: ['Glutes'] }, sets: 4, reps: '10-12', weight: '100kg', restTime: 90, equipment: 'machine' },
      { name: 'Leg Extension', muscleGroups: { primary: ['Quadriceps'], secondary: [] }, sets: 3, reps: '12-15', weight: '65kg', restTime: 60, equipment: 'machine' },
      { name: 'Seated Calf Raise', muscleGroups: { primary: ['Soleus'], secondary: [] }, sets: 5, reps: '15-20', weight: '40kg', restTime: 60, equipment: 'machine' },
    ]
  },
  {
    title: 'Arms & Core Annihilation',
    type: 'strength',
    splitFocus: 'Biceps, Triceps & Core',
    durationTarget: 50,
    caloriesBurned: 310,
    status: 'completed',
    aiExplanation: 'Dedicated arm day with isolation supersets. Core finisher with weighted carries.',
    exercises: [
      { name: 'Preacher Curl', muscleGroups: { primary: ['Biceps'], secondary: [] }, sets: 4, reps: '8-10', weight: '30kg', restTime: 75, equipment: 'machine' },
      { name: 'Overhead Tricep Extension', muscleGroups: { primary: ['Triceps'], secondary: [] }, sets: 4, reps: '10-12', weight: '22kg', restTime: 75, equipment: 'dumbbell' },
      { name: 'Cable Curl', muscleGroups: { primary: ['Biceps'], secondary: [] }, sets: 3, reps: '12-15', weight: '20kg', restTime: 60, equipment: 'cable' },
      { name: 'Rope Pushdown', muscleGroups: { primary: ['Triceps'], secondary: [] }, sets: 3, reps: '12-15', weight: '22kg', restTime: 60, equipment: 'cable' },
      { name: 'Farmer\'s Walk', muscleGroups: { primary: ['Core', 'Traps'], secondary: ['Forearms'] }, sets: 4, reps: '30m', weight: '32kg', restTime: 90, equipment: 'dumbbell' },
    ]
  },
  {
    title: 'Rest Day — Skipped',
    type: 'recovery',
    splitFocus: 'Full Body Mobility',
    durationTarget: 20,
    caloriesBurned: 0,
    status: 'skipped',
    aiExplanation: 'Recovery day. Body metrics suggested fatigue — wise to take the rest.',
    exercises: []
  },
  {
    title: 'Push Day — Heavy',
    type: 'strength',
    splitFocus: 'Chest & Triceps',
    durationTarget: 60,
    caloriesBurned: 430,
    status: 'completed',
    aiExplanation: 'Return to heavy push after rest day. Progressive overload applied to bench press.',
    exercises: [
      { name: 'Barbell Bench Press', muscleGroups: { primary: ['Chest'], secondary: ['Triceps'] }, sets: 5, reps: '5', weight: '87.5kg', restTime: 120, equipment: 'barbell' },
      { name: 'Incline Dumbbell Press', muscleGroups: { primary: ['Upper Chest'], secondary: ['Front Delts'] }, sets: 4, reps: '8-10', weight: '30kg', restTime: 90, equipment: 'dumbbell' },
      { name: 'Dumbbell Shoulder Press', muscleGroups: { primary: ['Delts'], secondary: ['Triceps'] }, sets: 3, reps: '10-12', weight: '22kg', restTime: 75, equipment: 'dumbbell' },
      { name: 'Lateral Raise Drop Set', muscleGroups: { primary: ['Lateral Delts'], secondary: [] }, sets: 3, reps: '12/10/8', weight: '12/10/8kg', restTime: 60, equipment: 'dumbbell' },
      { name: 'Tricep Dips', muscleGroups: { primary: ['Triceps'], secondary: ['Chest', 'Shoulders'] }, sets: 3, reps: 'AMRAP', weight: 'BW', restTime: 75, equipment: 'machine' },
    ]
  },
  {
    title: 'Pull Day — Volume',
    type: 'strength',
    splitFocus: 'Back & Rear Delts',
    durationTarget: 60,
    caloriesBurned: 415,
    status: 'completed',
    aiExplanation: 'Volume-focused pull session. Rear delt emphasis to balance shoulder development.',
    exercises: [
      { name: 'Weighted Pull-Ups', muscleGroups: { primary: ['Lats'], secondary: ['Biceps'] }, sets: 5, reps: '6', weight: '+12.5kg', restTime: 120, equipment: 'pull_up_bar' },
      { name: 'Cable Pullover', muscleGroups: { primary: ['Lats'], secondary: ['Core'] }, sets: 4, reps: '12', weight: '35kg', restTime: 75, equipment: 'cable' },
      { name: 'Chest-Supported Row', muscleGroups: { primary: ['Mid Back'], secondary: ['Biceps'] }, sets: 4, reps: '10-12', weight: '25kg', restTime: 75, equipment: 'dumbbell' },
      { name: 'Reverse Pec Deck', muscleGroups: { primary: ['Rear Delts'], secondary: ['Rhomboids'] }, sets: 3, reps: '15', weight: '40kg', restTime: 60, equipment: 'machine' },
      { name: 'Incline Dumbbell Curl', muscleGroups: { primary: ['Biceps'], secondary: [] }, sets: 3, reps: '10-12', weight: '14kg', restTime: 60, equipment: 'dumbbell' },
    ]
  },
  {
    title: 'Leg Day — Posterior Chain',
    type: 'strength',
    splitFocus: 'Hamstrings, Glutes & Calves',
    durationTarget: 65,
    caloriesBurned: 510,
    status: 'completed',
    aiExplanation: 'Hip-hinge dominant session for hamstring and glute hypertrophy. New PR on deadlift achieved.',
    exercises: [
      { name: 'Conventional Deadlift', muscleGroups: { primary: ['Hamstrings', 'Glutes'], secondary: ['Erectors', 'Traps'] }, sets: 5, reps: '3-5', weight: '130kg', restTime: 180, equipment: 'barbell' },
      { name: 'Romanian Deadlift', muscleGroups: { primary: ['Hamstrings'], secondary: ['Glutes', 'Lower Back'] }, sets: 4, reps: '8', weight: '85kg', restTime: 90, equipment: 'barbell' },
      { name: 'Hip Thrust', muscleGroups: { primary: ['Glutes'], secondary: ['Hamstrings'] }, sets: 4, reps: '10-12', weight: '90kg', restTime: 90, equipment: 'barbell' },
      { name: 'Lying Leg Curl', muscleGroups: { primary: ['Hamstrings'], secondary: [] }, sets: 3, reps: '12', weight: '50kg', restTime: 60, equipment: 'machine' },
      { name: 'Standing Calf Raise', muscleGroups: { primary: ['Calves'], secondary: [] }, sets: 4, reps: '20', weight: '85kg', restTime: 60, equipment: 'machine' },
    ]
  },
  {
    title: 'Today — Shoulders & Arms',
    type: 'strength',
    splitFocus: 'Shoulders & Arms',
    durationTarget: 55,
    caloriesBurned: null,
    status: 'planned',
    aiExplanation: 'Shoulder width and arm refinement day. Moderate volume after consecutive heavy compound sessions.',
    exercises: [
      { name: 'Seated Dumbbell Press', muscleGroups: { primary: ['Delts'], secondary: ['Triceps'] }, sets: 4, reps: '8-10', weight: '24kg', restTime: 90, equipment: 'dumbbell' },
      { name: 'Dumbbell Lateral Raise', muscleGroups: { primary: ['Lateral Delts'], secondary: [] }, sets: 4, reps: '12-15', weight: '12kg', restTime: 60, equipment: 'dumbbell' },
      { name: 'Bayesian Curl', muscleGroups: { primary: ['Biceps'], secondary: [] }, sets: 3, reps: '10-12', weight: '12kg', restTime: 60, equipment: 'cable' },
      { name: 'Tricep Pushdown', muscleGroups: { primary: ['Triceps'], secondary: [] }, sets: 3, reps: '12-15', weight: '28kg', restTime: 60, equipment: 'cable' },
      { name: 'Rear Delt Fly', muscleGroups: { primary: ['Rear Delts'], secondary: [] }, sets: 3, reps: '15', weight: '8kg', restTime: 60, equipment: 'dumbbell' },
    ]
  },
];

// ─── meal plan templates ───────────────────────────────────────────────────────

const MEAL_DAYS = [
  // Day 1
  { targetCalories: 2650, meals: [
    { type: 'breakfast', name: 'Masala Omelette + Whole Wheat Toast', foods: [{ name: 'Eggs (3)', quantity: '3 large', calories: 210, protein: 18, carbs: 2, fat: 14, fiber: 0 }, { name: 'Whole Wheat Toast', quantity: '2 slices', calories: 140, protein: 5, carbs: 26, fat: 2, fiber: 3 }, { name: 'Onion, Tomato, Green Chilli', quantity: '50g', calories: 20, protein: 1, carbs: 4, fat: 0, fiber: 1 }], totalCalories: 370, prepTime: 10 },
    { type: 'lunch', name: 'Chicken Tikka Masala + Brown Rice', foods: [{ name: 'Chicken Breast', quantity: '180g', calories: 297, protein: 56, carbs: 0, fat: 6, fiber: 0 }, { name: 'Brown Rice', quantity: '1 cup cooked', calories: 216, protein: 5, carbs: 45, fat: 2, fiber: 4 }, { name: 'Masala Sauce', quantity: '100g', calories: 80, protein: 3, carbs: 8, fat: 4, fiber: 1 }], totalCalories: 593, prepTime: 30 },
    { type: 'snack', name: 'Paneer Bhurji + Roti', foods: [{ name: 'Paneer', quantity: '80g', calories: 224, protein: 15, carbs: 3, fat: 17, fiber: 0 }, { name: 'Whole Wheat Roti', quantity: '1 piece', calories: 100, protein: 3, carbs: 20, fat: 1, fiber: 2 }], totalCalories: 324, prepTime: 15 },
    { type: 'dinner', name: 'Dal Makhani + Jeera Rice + Salad', foods: [{ name: 'Dal Makhani', quantity: '200g', calories: 256, protein: 13, carbs: 30, fat: 9, fiber: 8 }, { name: 'Jeera Rice', quantity: '1 cup', calories: 220, protein: 4, carbs: 46, fat: 3, fiber: 1 }, { name: 'Mixed Salad', quantity: '100g', calories: 35, protein: 2, carbs: 6, fat: 0, fiber: 3 }], totalCalories: 511, prepTime: 40 },
  ]},
  // Day 2
  { targetCalories: 2650, meals: [
    { type: 'breakfast', name: 'Poha with Peanuts', foods: [{ name: 'Poha (Flattened Rice)', quantity: '100g dry', calories: 333, protein: 7, carbs: 72, fat: 1, fiber: 2 }, { name: 'Peanuts', quantity: '30g', calories: 170, protein: 7, carbs: 5, fat: 14, fiber: 2 }, { name: 'Vegetables', quantity: '50g', calories: 25, protein: 1, carbs: 5, fat: 0, fiber: 2 }], totalCalories: 528, prepTime: 15 },
    { type: 'lunch', name: 'Grilled Chicken Wrap', foods: [{ name: 'Grilled Chicken', quantity: '150g', calories: 248, protein: 47, carbs: 0, fat: 5, fiber: 0 }, { name: 'Whole Wheat Wrap', quantity: '2 medium', calories: 200, protein: 6, carbs: 38, fat: 3, fiber: 4 }, { name: 'Curd + Mint Chutney', quantity: '80g', calories: 60, protein: 4, carbs: 6, fat: 2, fiber: 0 }], totalCalories: 508, prepTime: 20 },
    { type: 'snack', name: 'Sprouts Salad', foods: [{ name: 'Mixed Sprouts', quantity: '150g', calories: 135, protein: 10, carbs: 23, fat: 1, fiber: 6 }, { name: 'Lemon + Spices', quantity: '10g', calories: 5, protein: 0, carbs: 1, fat: 0, fiber: 0 }], totalCalories: 140, prepTime: 5 },
    { type: 'dinner', name: 'Fish Curry + Steamed Rice', foods: [{ name: 'Rohu Fish', quantity: '200g', calories: 196, protein: 38, carbs: 0, fat: 4, fiber: 0 }, { name: 'Curry Gravy', quantity: '100g', calories: 90, protein: 2, carbs: 6, fat: 6, fiber: 1 }, { name: 'Steamed Rice', quantity: '1 cup', calories: 206, protein: 4, carbs: 45, fat: 0, fiber: 1 }], totalCalories: 492, prepTime: 35 },
  ]},
  // Day 3
  { targetCalories: 2800, meals: [
    { type: 'breakfast', name: 'Protein Oat Bowl', foods: [{ name: 'Rolled Oats', quantity: '80g dry', calories: 308, protein: 11, carbs: 53, fat: 5, fiber: 8 }, { name: 'Whey Protein Powder', quantity: '30g', calories: 120, protein: 25, carbs: 2, fat: 1, fiber: 0 }, { name: 'Banana', quantity: '1 medium', calories: 105, protein: 1, carbs: 27, fat: 0, fiber: 3 }], totalCalories: 533, prepTime: 5 },
    { type: 'lunch', name: 'Mutton Biryani', foods: [{ name: 'Mutton Pieces', quantity: '150g', calories: 333, protein: 27, carbs: 0, fat: 24, fiber: 0 }, { name: 'Basmati Rice (biryani)', quantity: '150g cooked', calories: 195, protein: 4, carbs: 43, fat: 0, fiber: 1 }, { name: 'Raita', quantity: '100g', calories: 62, protein: 3, carbs: 6, fat: 3, fiber: 0 }], totalCalories: 590, prepTime: 60 },
    { type: 'snack', name: 'Greek Yogurt + Mixed Nuts', foods: [{ name: 'Greek Yogurt', quantity: '200g', calories: 130, protein: 18, carbs: 8, fat: 2, fiber: 0 }, { name: 'Mixed Nuts', quantity: '30g', calories: 180, protein: 5, carbs: 7, fat: 16, fiber: 2 }], totalCalories: 310, prepTime: 2 },
    { type: 'dinner', name: 'Palak Paneer + 3 Rotis', foods: [{ name: 'Palak Paneer', quantity: '250g', calories: 320, protein: 16, carbs: 12, fat: 22, fiber: 5 }, { name: 'Whole Wheat Roti', quantity: '3 pieces', calories: 300, protein: 9, carbs: 60, fat: 3, fiber: 6 }], totalCalories: 620, prepTime: 35 },
  ]},
  // Day 4
  { targetCalories: 2650, meals: [
    { type: 'breakfast', name: 'Idli with Sambar + Coconut Chutney', foods: [{ name: 'Idli', quantity: '4 pieces', calories: 240, protein: 7, carbs: 48, fat: 1, fiber: 2 }, { name: 'Sambar', quantity: '150ml', calories: 90, protein: 5, carbs: 12, fat: 2, fiber: 4 }, { name: 'Coconut Chutney', quantity: '40g', calories: 80, protein: 1, carbs: 4, fat: 7, fiber: 2 }], totalCalories: 410, prepTime: 20 },
    { type: 'lunch', name: 'Rajma Chawal', foods: [{ name: 'Rajma (Kidney Beans) Curry', quantity: '200g', calories: 224, protein: 13, carbs: 38, fat: 2, fiber: 11 }, { name: 'Steamed Rice', quantity: '1.5 cups', calories: 309, protein: 6, carbs: 68, fat: 0, fiber: 2 }], totalCalories: 533, prepTime: 40 },
    { type: 'snack', name: 'Boiled Eggs + Banana', foods: [{ name: 'Hard Boiled Eggs', quantity: '2 large', calories: 140, protein: 12, carbs: 1, fat: 10, fiber: 0 }, { name: 'Banana', quantity: '1 large', calories: 121, protein: 1, carbs: 31, fat: 0, fiber: 3 }], totalCalories: 261, prepTime: 10 },
    { type: 'dinner', name: 'Chicken Breast + Stir Fry Veggies', foods: [{ name: 'Grilled Chicken Breast', quantity: '200g', calories: 330, protein: 62, carbs: 0, fat: 7, fiber: 0 }, { name: 'Mixed Vegetables Stir Fry', quantity: '200g', calories: 100, protein: 5, carbs: 18, fat: 2, fiber: 7 }, { name: 'Brown Rice', quantity: '1 cup', calories: 216, protein: 5, carbs: 45, fat: 2, fiber: 4 }], totalCalories: 646, prepTime: 25 },
  ]},
  // Day 5 — cheat day
  { targetCalories: 3200, isCheatDay: true, meals: [
    { type: 'breakfast', name: 'Chole Bhature', foods: [{ name: 'Chole (Chickpea Curry)', quantity: '200g', calories: 270, protein: 14, carbs: 40, fat: 7, fiber: 10 }, { name: 'Bhature (2)', quantity: '2 pieces', calories: 400, protein: 8, carbs: 56, fat: 18, fiber: 2 }], totalCalories: 670, prepTime: 45 },
    { type: 'lunch', name: 'Chicken Biryani + Raita', foods: [{ name: 'Chicken Biryani', quantity: '350g', calories: 490, protein: 28, carbs: 55, fat: 18, fiber: 3 }, { name: 'Raita', quantity: '100g', calories: 62, protein: 3, carbs: 6, fat: 3, fiber: 0 }], totalCalories: 552, prepTime: 0 },
    { type: 'snack', name: 'Samosa + Chai', foods: [{ name: 'Samosa', quantity: '2 large', calories: 340, protein: 7, carbs: 42, fat: 16, fiber: 3 }, { name: 'Masala Chai', quantity: '200ml', calories: 80, protein: 3, carbs: 10, fat: 3, fiber: 0 }], totalCalories: 420, prepTime: 5 },
    { type: 'dinner', name: 'Butter Chicken + Garlic Naan', foods: [{ name: 'Butter Chicken', quantity: '250g', calories: 400, protein: 30, carbs: 14, fat: 26, fiber: 2 }, { name: 'Garlic Naan', quantity: '2 pieces', calories: 340, protein: 10, carbs: 58, fat: 8, fiber: 2 }], totalCalories: 740, prepTime: 0 },
  ]},
  // Day 6
  { targetCalories: 2650, meals: [
    { type: 'breakfast', name: 'Vegetable Upma + Coconut Chutney', foods: [{ name: 'Upma', quantity: '200g', calories: 280, protein: 8, carbs: 48, fat: 7, fiber: 4 }, { name: 'Coconut Chutney', quantity: '40g', calories: 80, protein: 1, carbs: 4, fat: 7, fiber: 2 }], totalCalories: 360, prepTime: 15 },
    { type: 'lunch', name: 'Egg Fried Rice', foods: [{ name: 'Basmati Rice', quantity: '180g cooked', calories: 234, protein: 4, carbs: 51, fat: 0, fiber: 1 }, { name: 'Eggs', quantity: '2 large', calories: 140, protein: 12, carbs: 1, fat: 10, fiber: 0 }, { name: 'Mixed Vegetables', quantity: '100g', calories: 50, protein: 2, carbs: 10, fat: 0, fiber: 3 }, { name: 'Soy Sauce + Oil', quantity: '15g', calories: 65, protein: 1, carbs: 3, fat: 5, fiber: 0 }], totalCalories: 489, prepTime: 20 },
    { type: 'snack', name: 'Protein Shake + Apple', foods: [{ name: 'Whey Protein Shake', quantity: '30g powder', calories: 120, protein: 25, carbs: 2, fat: 1, fiber: 0 }, { name: 'Apple', quantity: '1 medium', calories: 95, protein: 0, carbs: 25, fat: 0, fiber: 4 }], totalCalories: 215, prepTime: 3 },
    { type: 'dinner', name: 'Tandoori Chicken + Roti + Dal', foods: [{ name: 'Tandoori Chicken', quantity: '200g', calories: 286, protein: 50, carbs: 5, fat: 8, fiber: 0 }, { name: 'Whole Wheat Roti', quantity: '2 pieces', calories: 200, protein: 6, carbs: 40, fat: 2, fiber: 4 }, { name: 'Yellow Dal', quantity: '150g', calories: 156, protein: 10, carbs: 25, fat: 2, fiber: 6 }], totalCalories: 642, prepTime: 35 },
  ]},
  // Day 7
  { targetCalories: 2700, meals: [
    { type: 'breakfast', name: 'Dosa + Sambar', foods: [{ name: 'Plain Dosa', quantity: '2 large', calories: 200, protein: 4, carbs: 40, fat: 4, fiber: 1 }, { name: 'Sambar', quantity: '200ml', calories: 120, protein: 6, carbs: 16, fat: 3, fiber: 5 }], totalCalories: 320, prepTime: 20 },
    { type: 'lunch', name: 'Paneer Tikka + Brown Rice', foods: [{ name: 'Paneer Tikka', quantity: '150g', calories: 375, protein: 25, carbs: 8, fat: 28, fiber: 1 }, { name: 'Brown Rice', quantity: '1 cup', calories: 216, protein: 5, carbs: 45, fat: 2, fiber: 4 }], totalCalories: 591, prepTime: 30 },
    { type: 'snack', name: 'Roasted Chana + Chai', foods: [{ name: 'Roasted Chana', quantity: '50g', calories: 180, protein: 10, carbs: 30, fat: 3, fiber: 8 }, { name: 'Masala Chai', quantity: '200ml', calories: 80, protein: 3, carbs: 10, fat: 3, fiber: 0 }], totalCalories: 260, prepTime: 5 },
    { type: 'dinner', name: 'Chicken Keema + Paratha', foods: [{ name: 'Chicken Keema', quantity: '180g', calories: 320, protein: 35, carbs: 8, fat: 17, fiber: 2 }, { name: 'Whole Wheat Paratha', quantity: '2 medium', calories: 300, protein: 8, carbs: 52, fat: 8, fiber: 5 }], totalCalories: 620, prepTime: 30 },
  ]},
  // Day 8
  { targetCalories: 2650, meals: [
    { type: 'breakfast', name: 'Peanut Butter Toast + Banana Shake', foods: [{ name: 'Whole Wheat Bread', quantity: '2 slices', calories: 140, protein: 5, carbs: 26, fat: 2, fiber: 3 }, { name: 'Peanut Butter', quantity: '2 tbsp', calories: 190, protein: 7, carbs: 7, fat: 16, fiber: 2 }, { name: 'Banana Shake', quantity: '300ml', calories: 220, protein: 8, carbs: 42, fat: 3, fiber: 2 }], totalCalories: 550, prepTime: 10 },
    { type: 'lunch', name: 'Aloo Gobi + Roti', foods: [{ name: 'Aloo Gobi', quantity: '250g', calories: 220, protein: 6, carbs: 38, fat: 7, fiber: 7 }, { name: 'Whole Wheat Roti', quantity: '3 pieces', calories: 300, protein: 9, carbs: 60, fat: 3, fiber: 6 }], totalCalories: 520, prepTime: 30 },
    { type: 'snack', name: 'Boiled Egg + Protein Bar', foods: [{ name: 'Boiled Eggs', quantity: '2 large', calories: 140, protein: 12, carbs: 1, fat: 10, fiber: 0 }, { name: 'Protein Bar', quantity: '60g', calories: 210, protein: 20, carbs: 22, fat: 7, fiber: 3 }], totalCalories: 350, prepTime: 5 },
    { type: 'dinner', name: 'Grilled Fish + Quinoa', foods: [{ name: 'Surmai (Kingfish) Grilled', quantity: '200g', calories: 252, protein: 42, carbs: 0, fat: 9, fiber: 0 }, { name: 'Quinoa', quantity: '1 cup cooked', calories: 222, protein: 8, carbs: 39, fat: 4, fiber: 5 }, { name: 'Stir Fried Greens', quantity: '100g', calories: 45, protein: 3, carbs: 7, fat: 1, fiber: 4 }], totalCalories: 519, prepTime: 25 },
  ]},
  // Day 9
  { targetCalories: 2700, meals: [
    { type: 'breakfast', name: 'Moong Dal Chilla', foods: [{ name: 'Moong Dal Chilla', quantity: '3 pieces', calories: 330, protein: 18, carbs: 45, fat: 7, fiber: 8 }, { name: 'Green Chutney', quantity: '30g', calories: 25, protein: 1, carbs: 3, fat: 1, fiber: 1 }], totalCalories: 355, prepTime: 20 },
    { type: 'lunch', name: 'Chicken Biryani', foods: [{ name: 'Chicken Biryani', quantity: '350g', calories: 490, protein: 28, carbs: 55, fat: 18, fiber: 3 }], totalCalories: 490, prepTime: 0 },
    { type: 'snack', name: 'Dry Fruits & Nuts Mix', foods: [{ name: 'Almonds', quantity: '20g', calories: 116, protein: 4, carbs: 4, fat: 10, fiber: 2 }, { name: 'Walnuts', quantity: '15g', calories: 98, protein: 2, carbs: 2, fat: 10, fiber: 1 }, { name: 'Raisins', quantity: '20g', calories: 60, protein: 0, carbs: 16, fat: 0, fiber: 1 }], totalCalories: 274, prepTime: 0 },
    { type: 'dinner', name: 'Sabji + Dal Fry + 2 Rotis', foods: [{ name: 'Mix Vegetable Curry', quantity: '200g', calories: 180, protein: 6, carbs: 28, fat: 6, fiber: 7 }, { name: 'Dal Fry', quantity: '150g', calories: 175, protein: 11, carbs: 27, fat: 3, fiber: 7 }, { name: 'Whole Wheat Roti', quantity: '2 pieces', calories: 200, protein: 6, carbs: 40, fat: 2, fiber: 4 }], totalCalories: 555, prepTime: 40 },
  ]},
  // Day 10
  { targetCalories: 2650, meals: [
    { type: 'breakfast', name: 'Scrambled Eggs + Multigrain Toast', foods: [{ name: 'Scrambled Eggs (3)', quantity: '3 large', calories: 250, protein: 20, carbs: 3, fat: 18, fiber: 0 }, { name: 'Multigrain Toast', quantity: '2 slices', calories: 160, protein: 6, carbs: 28, fat: 3, fiber: 4 }, { name: 'Cherry Tomatoes', quantity: '50g', calories: 18, protein: 1, carbs: 4, fat: 0, fiber: 1 }], totalCalories: 428, prepTime: 10 },
    { type: 'lunch', name: 'Chole Curry + Steamed Rice', foods: [{ name: 'Chole Curry', quantity: '200g', calories: 270, protein: 14, carbs: 40, fat: 7, fiber: 10 }, { name: 'Steamed Basmati Rice', quantity: '1.5 cups', calories: 309, protein: 6, carbs: 68, fat: 0, fiber: 1 }], totalCalories: 579, prepTime: 35 },
    { type: 'snack', name: 'Greek Yogurt Parfait', foods: [{ name: 'Greek Yogurt', quantity: '150g', calories: 98, protein: 14, carbs: 6, fat: 2, fiber: 0 }, { name: 'Granola', quantity: '30g', calories: 135, protein: 3, carbs: 22, fat: 4, fiber: 2 }, { name: 'Mixed Berries', quantity: '80g', calories: 48, protein: 1, carbs: 11, fat: 0, fiber: 3 }], totalCalories: 281, prepTime: 5 },
    { type: 'dinner', name: 'Egg Curry + Brown Rice', foods: [{ name: 'Egg Curry (3 eggs)', quantity: '250g', calories: 365, protein: 22, carbs: 12, fat: 26, fiber: 3 }, { name: 'Brown Rice', quantity: '1 cup', calories: 216, protein: 5, carbs: 45, fat: 2, fiber: 4 }], totalCalories: 581, prepTime: 25 },
  ]},
  // Day 11 — skipped workout, lighter eating
  { targetCalories: 2200, meals: [
    { type: 'breakfast', name: 'Fruit Salad + Curd', foods: [{ name: 'Mixed Fruit', quantity: '200g', calories: 120, protein: 2, carbs: 30, fat: 0, fiber: 4 }, { name: 'Curd', quantity: '150g', calories: 90, protein: 5, carbs: 9, fat: 4, fiber: 0 }], totalCalories: 210, prepTime: 5 },
    { type: 'lunch', name: 'Paneer Sandwich + Soup', foods: [{ name: 'Paneer Sandwich', quantity: '1 large', calories: 380, protein: 18, carbs: 42, fat: 16, fiber: 4 }, { name: 'Tomato Soup', quantity: '200ml', calories: 90, protein: 2, carbs: 15, fat: 3, fiber: 2 }], totalCalories: 470, prepTime: 15 },
    { type: 'snack', name: 'Buttermilk + Rice Cakes', foods: [{ name: 'Buttermilk (Chaas)', quantity: '300ml', calories: 75, protein: 5, carbs: 10, fat: 2, fiber: 0 }, { name: 'Rice Cakes', quantity: '3 cakes', calories: 105, protein: 2, carbs: 22, fat: 0, fiber: 0 }], totalCalories: 180, prepTime: 3 },
    { type: 'dinner', name: 'Dal Khichdi', foods: [{ name: 'Dal Khichdi', quantity: '300g', calories: 360, protein: 15, carbs: 60, fat: 7, fiber: 8 }], totalCalories: 360, prepTime: 25 },
  ]},
  // Day 12
  { targetCalories: 2700, meals: [
    { type: 'breakfast', name: 'Besan Cheela + Curd', foods: [{ name: 'Besan Cheela', quantity: '3 pieces', calories: 315, protein: 17, carbs: 42, fat: 8, fiber: 6 }, { name: 'Curd', quantity: '100g', calories: 60, protein: 3, carbs: 6, fat: 3, fiber: 0 }], totalCalories: 375, prepTime: 20 },
    { type: 'lunch', name: 'Chicken Curry + Jeera Rice', foods: [{ name: 'Chicken Curry (medium)', quantity: '200g', calories: 350, protein: 38, carbs: 10, fat: 18, fiber: 2 }, { name: 'Jeera Rice', quantity: '1.5 cups', calories: 330, protein: 6, carbs: 69, fat: 4, fiber: 1 }], totalCalories: 680, prepTime: 35 },
    { type: 'snack', name: 'Protein Shake + Banana', foods: [{ name: 'Whey Protein', quantity: '30g', calories: 120, protein: 25, carbs: 2, fat: 1, fiber: 0 }, { name: 'Banana', quantity: '1 large', calories: 121, protein: 1, carbs: 31, fat: 0, fiber: 3 }], totalCalories: 241, prepTime: 3 },
    { type: 'dinner', name: 'Shahi Paneer + Roti', foods: [{ name: 'Shahi Paneer', quantity: '200g', calories: 380, protein: 20, carbs: 16, fat: 28, fiber: 2 }, { name: 'Whole Wheat Roti', quantity: '2 pieces', calories: 200, protein: 6, carbs: 40, fat: 2, fiber: 4 }], totalCalories: 580, prepTime: 30 },
  ]},
  // Day 13
  { targetCalories: 2650, meals: [
    { type: 'breakfast', name: 'Aloo Paratha + Curd', foods: [{ name: 'Aloo Paratha', quantity: '2 medium', calories: 380, protein: 9, carbs: 58, fat: 14, fiber: 5 }, { name: 'Curd', quantity: '100g', calories: 60, protein: 3, carbs: 6, fat: 3, fiber: 0 }], totalCalories: 440, prepTime: 20 },
    { type: 'lunch', name: 'Tuna Salad Bowl', foods: [{ name: 'Canned Tuna', quantity: '150g', calories: 157, protein: 35, carbs: 0, fat: 1, fiber: 0 }, { name: 'Brown Rice', quantity: '1 cup', calories: 216, protein: 5, carbs: 45, fat: 2, fiber: 4 }, { name: 'Greens + Veggies', quantity: '150g', calories: 60, protein: 3, carbs: 12, fat: 0, fiber: 5 }, { name: 'Olive Oil Dressing', quantity: '15ml', calories: 120, protein: 0, carbs: 0, fat: 14, fiber: 0 }], totalCalories: 553, prepTime: 10 },
    { type: 'snack', name: 'Mixed Nuts + Dark Chocolate', foods: [{ name: 'Mixed Nuts', quantity: '30g', calories: 180, protein: 5, carbs: 7, fat: 16, fiber: 2 }, { name: 'Dark Chocolate 70%', quantity: '20g', calories: 110, protein: 2, carbs: 10, fat: 8, fiber: 2 }], totalCalories: 290, prepTime: 0 },
    { type: 'dinner', name: 'Palak Chicken + Roti', foods: [{ name: 'Palak Chicken', quantity: '220g', calories: 330, protein: 40, carbs: 12, fat: 14, fiber: 4 }, { name: 'Whole Wheat Roti', quantity: '2 pieces', calories: 200, protein: 6, carbs: 40, fat: 2, fiber: 4 }], totalCalories: 530, prepTime: 35 },
  ]},
  // Day 14
  { targetCalories: 2700, meals: [
    { type: 'breakfast', name: 'Masala Omelette + Multigrain Toast', foods: [{ name: 'Eggs (3)', quantity: '3 large', calories: 210, protein: 18, carbs: 2, fat: 14, fiber: 0 }, { name: 'Multigrain Toast', quantity: '2 slices', calories: 160, protein: 6, carbs: 28, fat: 3, fiber: 4 }], totalCalories: 370, prepTime: 10 },
    { type: 'lunch', name: 'Chicken Tikka Masala + Naan', foods: [{ name: 'Chicken Tikka Masala', quantity: '200g', calories: 380, protein: 42, carbs: 14, fat: 18, fiber: 2 }, { name: 'Garlic Naan', quantity: '1 piece', calories: 170, protein: 5, carbs: 29, fat: 4, fiber: 1 }], totalCalories: 550, prepTime: 30 },
    { type: 'snack', name: 'Protein Smoothie', foods: [{ name: 'Whey Protein', quantity: '30g', calories: 120, protein: 25, carbs: 2, fat: 1, fiber: 0 }, { name: 'Banana', quantity: '1 medium', calories: 105, protein: 1, carbs: 27, fat: 0, fiber: 3 }, { name: 'Almond Milk', quantity: '250ml', calories: 40, protein: 1, carbs: 4, fat: 2, fiber: 1 }], totalCalories: 265, prepTime: 5 },
    { type: 'dinner', name: 'Baked Fish + Quinoa + Salad', foods: [{ name: 'Pomfret Baked', quantity: '200g', calories: 238, protein: 40, carbs: 0, fat: 8, fiber: 0 }, { name: 'Quinoa', quantity: '1 cup cooked', calories: 222, protein: 8, carbs: 39, fat: 4, fiber: 5 }, { name: 'Garden Salad', quantity: '120g', calories: 50, protein: 2, carbs: 10, fat: 0, fiber: 4 }], totalCalories: 510, prepTime: 30 },
  ]},
  // Day 15 — today, not yet consumed
  { targetCalories: 2650, meals: [
    { type: 'breakfast', name: 'Protein Oat Bowl', foods: [{ name: 'Rolled Oats', quantity: '80g', calories: 308, protein: 11, carbs: 53, fat: 5, fiber: 8 }, { name: 'Whey Protein', quantity: '30g', calories: 120, protein: 25, carbs: 2, fat: 1, fiber: 0 }, { name: 'Berries', quantity: '80g', calories: 46, protein: 1, carbs: 11, fat: 0, fiber: 3 }], totalCalories: 474, prepTime: 5 },
    { type: 'lunch', name: 'Chicken Breast + Brown Rice + Dal', foods: [{ name: 'Grilled Chicken Breast', quantity: '180g', calories: 297, protein: 56, carbs: 0, fat: 6, fiber: 0 }, { name: 'Brown Rice', quantity: '1 cup', calories: 216, protein: 5, carbs: 45, fat: 2, fiber: 4 }, { name: 'Yellow Dal', quantity: '150g', calories: 156, protein: 10, carbs: 25, fat: 2, fiber: 6 }], totalCalories: 669, prepTime: 25 },
    { type: 'snack', name: 'Greek Yogurt + Nuts', foods: [{ name: 'Greek Yogurt', quantity: '200g', calories: 130, protein: 18, carbs: 8, fat: 2, fiber: 0 }, { name: 'Almonds', quantity: '25g', calories: 145, protein: 5, carbs: 5, fat: 13, fiber: 3 }], totalCalories: 275, prepTime: 2 },
    { type: 'dinner', name: 'Palak Paneer + 2 Rotis', foods: [{ name: 'Palak Paneer', quantity: '200g', calories: 256, protein: 13, carbs: 10, fat: 18, fiber: 4 }, { name: 'Whole Wheat Roti', quantity: '2 pieces', calories: 200, protein: 6, carbs: 40, fat: 2, fiber: 4 }], totalCalories: 456, prepTime: 35 },
  ]},
];

// ─── health metrics ────────────────────────────────────────────────────────────
// Simulate gradual improvement over 14 days: slight weight drop, improving sleep, lower resting HR

function buildHealthMetric(userId, daysBack) {
  const progressFactor = (14 - daysBack) / 14; // 0 on day 14 ago, 1 on today
  return {
    userId,
    date: daysAgo(daysBack),
    source: 'watch_sim',
    heartRate: {
      resting: Math.round(68 - progressFactor * 4 + rand(-2, 2)),   // 68→64 trend
      active: rand(130, 165),
      max: rand(168, 185)
    },
    sleep: {
      duration: randF(6.5, 8.0),
      quality: Math.min(10, Math.round(6.5 + progressFactor * 2 + rand(-1, 1))),
      deepSleep: randF(1.2, 2.2),
      remSleep: randF(1.0, 1.8),
      lightSleep: randF(3.0, 4.5)
    },
    steps: rand(7500, 13000),
    caloriesBurned: rand(420, 620),
    hydration: randF(2.2, 3.5),
    stress: Math.max(1, Math.round(7 - progressFactor * 3 + rand(-2, 2))), // 7→4 trend
    soreness: {
      level: rand(2, 7),
      bodyParts: [['Chest', 'Triceps'], ['Back', 'Biceps'], ['Legs', 'Glutes'], ['Shoulders']][daysBack % 4]
    },
    weight: parseFloat((82.8 - progressFactor * 1.2 + randF(-0.2, 0.2)).toFixed(1)), // 82.8→81.6
    bloodPressure: { systolic: rand(116, 128), diastolic: rand(74, 82) }
  };
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function seed() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitai';
  console.log(`\n[Seed] Connecting to ${mongoUri}`);
  await mongoose.connect(mongoUri);
  console.log('[Seed] Connected.\n');

  const salt = await bcrypt.genSalt(10);
  const demoHash = await bcrypt.hash('FitDemo@2026', salt);
  const newHash  = await bcrypt.hash('NewUser@2026', salt);

  // ── 1. Create / upsert both users ──────────────────────────────────────────

  const demoUser = await User.findOneAndUpdate(
    { email: 'demo@fitai.app' },
    {
      name: 'Aditya Kumar',
      email: 'demo@fitai.app',
      password: demoHash,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aditya',
      profile: {
        age: 28,
        gender: 'male',
        height: 176,
        weight: 81.6,
        bodyFatPercentage: 16,
        fitnessLevel: 'intermediate',
        activityLevel: 'active'
      },
      healthProfile: {
        chronicConditions: [],
        allergies: [],
        bloodType: 'B+'
      },
      injuries: [],
      equipment: ['barbell', 'dumbbell', 'cable', 'machine', 'rack', 'bench', 'pull_up_bar'],
      preferences: {
        workoutDuration: 55,
        workoutLocation: 'gym',
        dietType: 'omnivore',
        budget: 'medium',
        cookingSkill: 'intermediate',
        country: 'India',
        cuisine: 'north',
        cuisinePerMeal: { breakfast: 'any', lunch: 'north', snack: '', dinner: 'north' },
        cheatDays: [{ dayOfWeek: 0, type: 'full' }] // Sunday cheat day
      },
      currentGoal: {
        type: 'muscle_gain',
        targetValue: 85,
        startValue: 83,
        unit: 'kg',
        startDate: new Date('2026-07-14'),
        deadline: new Date('2026-10-31')
      },
      streak: {
        current: 14,
        longest: 21,
        lastWorkoutDate: daysAgo(0)
      },
      gamification: {
        level: 8,
        xp: 7200,
        xpToNextLevel: 8000,
        rankTitle: 'Iron Warrior',
        archetype: {
          id: 'iron_titan',
          name: 'Iron Titan',
          tagline: 'Forged under pressure. Built to last.',
          icon: '🏋️',
          color: '#6366f1',
          bonusStats: { strength: 20, endurance: 5, mobility: 5, consistency: 10, recovery: 10 }
        },
        attributes: {
          strength: 42,
          endurance: 28,
          mobility: 19,
          consistency: 38,
          recovery: 31
        },
        unlockedAchievementIds: [
          'first_workout', 'streak_3', 'streak_7', 'streak_14',
          'first_pr', 'calorie_burn_1000', 'level_5', 'level_8'
        ],
        unlockedPerkIds: ['extra_swap', 'recovery_boost'],
        prHallOfFame: [
          { title: 'Bench Press 1RM', value: '92.5 kg', date: daysAgo(3) },
          { title: 'Deadlift 1RM', value: '132.5 kg', date: daysAgo(1) },
          { title: 'Squat 1RM', value: '107.5 kg', date: daysAgo(11) },
          { title: 'Overhead Press 1RM', value: '58 kg', date: daysAgo(10) }
        ],
        totalWorkoutsCompleted: 13,
        totalRepsLogged: 2847,
        longestCompletedWorkoutMins: 68
      },
      onboardingCompleted: true
    },
    { upsert: true, new: true }
  );
  console.log(`[Seed] Demo user ready: demo@fitai.app  /  FitDemo@2026  (id: ${demoUser._id})`);

  const newUser = await User.findOneAndUpdate(
    { email: 'newuser@fitai.app' },
    {
      name: 'New User',
      email: 'newuser@fitai.app',
      password: newHash,
      onboardingCompleted: false
    },
    { upsert: true, new: true }
  );
  console.log(`[Seed] New onboarding user ready: newuser@fitai.app  /  NewUser@2026  (id: ${newUser._id})`);

  // ── 2. Wipe old demo data for demoUser then rebuild ────────────────────────

  console.log('\n[Seed] Clearing old workout / meal / health / body-comp data for demo user...');
  await Promise.all([
    Workout.deleteMany({ userId: demoUser._id }),
    MealPlan.deleteMany({ userId: demoUser._id }),
    HealthMetric.deleteMany({ userId: demoUser._id }),
    BodyComposition.deleteMany({ userId: demoUser._id }),
  ]);

  // ── 3. Workouts — 14 past days + today ────────────────────────────────────

  console.log('[Seed] Inserting 15 workouts (14 days history + today)...');
  for (let i = 0; i < WORKOUT_DAYS.length; i++) {
    const daysBack = 14 - i; // 14 … 0
    const template = WORKOUT_DAYS[i];
    await Workout.create({
      userId: demoUser._id,
      date: daysAgo(daysBack),
      ...template
    });
  }

  // ── 4. Meal plans — 14 past days + today ──────────────────────────────────

  console.log('[Seed] Inserting 15 meal plans (14 days history + today)...');
  for (let i = 0; i < MEAL_DAYS.length; i++) {
    const daysBack = 14 - i;
    const template = MEAL_DAYS[i];

    // Mark earlier meals as consumed (not today)
    const meals = template.meals.map(m => ({
      ...m,
      consumed: daysBack > 0,
      consumedAt: daysBack > 0 ? daysAgo(daysBack) : undefined
    }));

    // Recalculate daily totals
    const totals = meals.reduce((acc, m) => {
      acc.calories += m.totalCalories;
      m.foods.forEach(f => {
        acc.protein += f.protein;
        acc.carbs   += f.carbs;
        acc.fat     += f.fat;
        acc.fiber   += f.fiber;
      });
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    await MealPlan.create({
      userId: demoUser._id,
      date: daysAgo(daysBack),
      meals,
      dailyTotals: totals,
      targetCalories: template.targetCalories,
      aiGenerated: true,
      isCheatDay: template.isCheatDay || false
    });
  }

  // ── 5. Health metrics — 14 days ───────────────────────────────────────────

  console.log('[Seed] Inserting 14 health metric snapshots...');
  for (let i = 14; i >= 1; i--) {
    await HealthMetric.create(buildHealthMetric(demoUser._id, i));
  }

  // ── 6. Body composition snapshots — weekly ────────────────────────────────

  console.log('[Seed] Inserting body composition snapshots...');
  const bfPoints = [
    { daysBack: 14, bf: 18.2, leanMass: 67.8, bmi: 26.8, fitnessScore: 52 },
    { daysBack: 7,  bf: 17.4, leanMass: 68.3, bmi: 26.5, fitnessScore: 58 },
    { daysBack: 0,  bf: 16.1, leanMass: 68.7, bmi: 26.3, fitnessScore: 64 },
  ];
  for (const p of bfPoints) {
    await BodyComposition.create({
      userId: demoUser._id,
      date: daysAgo(p.daysBack),
      bodyFatPercentage: p.bf,
      leanMassKg: p.leanMass,
      bmi: p.bmi,
      fitnessScore: p.fitnessScore
    });
  }

  console.log('\n✅ Seeding complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  VETERAN DEMO USER (14 days of data)');
  console.log('  Email   : demo@fitai.app');
  console.log('  Password: FitDemo@2026');
  console.log('  Profile : Aditya Kumar, 28M, 176cm/81.6kg, Intermediate gym');
  console.log('  Goal    : Muscle Gain (83kg → 85kg by Oct 2026)');
  console.log('  Streak  : 14 days  |  Level 8 "Iron Warrior"  |  4 PRs logged');
  console.log('');
  console.log('  FRESH ONBOARDING USER');
  console.log('  Email   : newuser@fitai.app');
  console.log('  Password: NewUser@2026');
  console.log('  Profile : blank — walks through full onboarding flow');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
}

seed().catch(err => {
  console.error('[Seed] Fatal error:', err);
  process.exit(1);
});
