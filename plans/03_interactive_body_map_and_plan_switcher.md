# Interactive Body Map, Plan Generator & Theme Harmonization Plan ⚡

This document details the architectural plan and code upgrades for the Interactive Body Map, Workout Plan Switcher, Auto-Plan Generator, and CSS Theme Token Harmonization.

---

## 🎯 Primary Objectives

1. **Interactive SVG Body Map Selection**: Enable interactive clicking on muscle regions (Chest, Shoulders, Back, Biceps, Abs/Core, Quads, Calves) on the human body silhouette.
2. **Instant Plan Generator & Switcher**: When a user clicks any muscle region on the body map, the system must **automatically generate/load the optimal workout plan** targeting that muscle group without returning empty ("0 Exercises Found") states.
3. **Preset Split Management & Persistence**: Support 5 full workout plans with Redux Toolkit and `localStorage` state synchronization (`fitai_today_workout`).
4. **CSS Theme Variable Harmonization**: Replace hardcoded dark slate colors (`bg-[#0F172A]`, `bg-slate-900`) in lower workout components with CSS theme variables (`var(--bg-secondary)`, `var(--bg-tertiary)`, `var(--border-color)`, `var(--text-primary)`, `var(--accent-primary)`).

---

## 🛠 Architectural Implementation

### 1. `workoutSlice.js` Plan Core
- Registered 5 preset plans in `WORKOUT_PLANS`:
  - `hypertrophy_upper`: Chest, Shoulders, Triceps (Bench Press, Incline DB Press, DB Shoulder Press, Decline Push-Up).
  - `power_pull`: Lats, Upper Back, Biceps (Bent-Over Row, Lat Pulldown, Cable Face Pull, Hammer Curls).
  - `legs_titan`: Quads, Hamstrings, Glutes, Calves (Incline Leg Press, Romanian Deadlift, Bulgarian Split Squat, Standing Calf Raises).
  - `full_body`: Chest, Back, Legs, Core (Goblet Squats, Single-Arm DB Row, Push-Up Taps, RKC Core Plank).
  - `rehab_core`: Abs, Core, Spinal Decompression (RKC Core Planks, Bird-Dogs, Y-T-W Raises, Cat-Cow Flexion).
- Added `selectWorkoutPlan(planId)` reducer with `localStorage` write/read.

### 2. `MuscleHeatmap.jsx` Interactive Body SVG
- SVG paths & shapes mapped with `onClick` handlers for:
  - `chest`, `shoulders`, `biceps`, `abs`, `quads`, `calves`.
- Interactive filter chips rendered below the silhouette.
- Glowing primary accent borders on selected/active muscles.

### 3. `WorkoutBuilder.jsx` Plan Generator Dispatcher
- `handleMuscleClick(muscleId)` maps clicked body part to target plan:
  - `chest` / `shoulders` -> `hypertrophy_upper`
  - `back` / `biceps` -> `power_pull`
  - `abs` / `core` -> `rehab_core`
  - `quads` / `legs` / `calves` -> `legs_titan`
- Automatically dispatches `selectWorkoutPlan(targetPlanId)` and triggers toast alert `AI Generated & Loaded Workout Plan for [MUSCLE]!`.

### 4. Theme Token Replacement
- Refactored `WorkoutSimulator.jsx`, `ProgressiveOverload.jsx`, `VersionCompare.jsx`, and `WorkoutHistory.jsx`.
- Replaced hardcoded `#0F172A` / `#111827` with `var(--bg-secondary)` and `var(--bg-tertiary)`.
- Replaced hardcoded text with `var(--text-primary)` and `var(--text-secondary)`.

---

## 🧪 Verification & Results
- Verified clean build (`npm run build`).
- Confirmed body map click instantly switches active workout plan.
- Confirmed theme switching (Sage Light, Arctic White, Sand Dune, Midnight Carbon) seamlessly updates upper and lower workout sections.
