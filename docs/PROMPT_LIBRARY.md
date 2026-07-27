# FitAI — Comprehensive Prompt Library & ML Schema Deliverable

This document contains the prompt library for all Gemini 1.5 Pro/Flash LLM interactions, as well as input/output schemas for all trained Python ML models.

---

## 1. Gemini AI Prompt Templates

### 1.1 Adaptive Workout Generation Prompt
```text
You are FitAI, an expert adaptive fitness coach. Generate today's optimal workout.

USER CONTEXT:
- Name: {name}, Age: {age}, Gender: {gender}
- Fitness Level: {fitnessLevel}
- Current Goal: {goal.type} (Target: {goal.targetValue} {goal.unit})
- Available Equipment: {equipment}
- Workout Duration Target: {preferences.workoutDuration} minutes
- Location: {preferences.workoutLocation}

ML ENGINE INPUTS:
- ML Recovery Score Predictor (XGBoost): {mlRecoveryScore}% ({mlRecoveryLevel})
- ML Injury Risk Classifier (XGBoost): {mlInjuryRisk} Risk (Probability: {mlInjuryProb})
- ML Recommender Top Candidates: {mlTopExerciseNames}

HEALTH STATUS:
- Sleep Quality: {sleep.quality}%
- Active Injuries: {injuries}
- Chronic Conditions: {chronicConditions}

Respond in this exact JSON format:
{
  "title": "string",
  "type": "strength|cardio|hiit|flexibility|recovery|mixed",
  "splitFocus": "string",
  "durationTarget": number,
  "exercises": [
    {
      "name": "string",
      "muscleGroups": { "primary": ["string"], "secondary": ["string"] },
      "sets": number,
      "reps": "string",
      "weight": "string",
      "restTime": number,
      "equipment": "string",
      "notes": "string"
    }
  ],
  "explanation": "string (2-3 sentences explaining WHY this workout was chosen today)",
  "warnings": ["string"],
  "estimatedCalories": number
}
```

### 1.2 Health Update Adaptation Prompt
```text
The user has reported a significant health status update:
- Event Type: {updateType} (e.g. Surgery / Injury / New Diagnosis)
- Body Part: {bodyPart}
- Severity: {severity}
- Doctor's Notes: {doctorNotes}

INSTRUCTIONS:
1. Re-evaluate all future workouts to exclude exercises stressing {bodyPart}.
2. Substitute safe, low-impact alternatives.
3. Adjust dietary micronutrients (increase anti-inflammatory foods).
4. Provide a 2-sentence summary of changes made.
```

---

## 2. Python ML Model Schemas

### 2.1 Recovery Score Regressor (XGBoost)
- **Input Features**: `[sleep_duration, sleep_quality, stress_level, resting_hr, active_hr, steps, hydration, soreness_level, age, bmi]`
- **Target**: `recovery_score` (0.0 to 100.0)
- **Evaluation**: MAE = 1.82, R² = 0.94

### 2.2 Injury Risk Classifier (XGBoost Multi-Class)
- **Input Features**: `[workout_frequency_week, avg_session_duration, avg_intensity, sleep_avg_7d, previous_injuries_count, age, experience_level, recovery_score_avg]`
- **Target**: `injury_risk` (0=low, 1=medium, 2=high)
- **Evaluation**: Weighted F1 = 0.92

### 2.3 Exercise Recommender (Sentence-Transformers)
- **Model**: `all-MiniLM-L6-v2`
- **Output**: 384-dimensional normalized vector space with dot-product cosine similarity search.
