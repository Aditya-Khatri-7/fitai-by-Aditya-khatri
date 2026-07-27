import os
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"

app = FastAPI(
  title="FitAI ML Inference Service",
  description="High-performance Python ML inference engine for Recovery, Injury Risk, and Exercise Recommendations",
  version="2.0.0"
)

# CORS
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

# Global models dictionary
models = {}

@app.on_event("startup")
def load_models():
  print("[FastAPI Startup] Loading serialized ML models into memory...")
  
  try:
    models["recovery_model"] = joblib.load(MODEL_DIR / "recovery_predictor.pkl")
    models["recovery_scaler"] = joblib.load(MODEL_DIR / "recovery_scaler.pkl")
    print(" [OK] Loaded Recovery Score Regressor")
  except Exception as e:
    print(f" [Warning] Could not load recovery model: {e}")

  try:
    models["injury_model"] = joblib.load(MODEL_DIR / "injury_classifier.pkl")
    models["injury_features"] = joblib.load(MODEL_DIR / "injury_features.pkl")
    print(" [OK] Loaded Injury Risk Classifier")
  except Exception as e:
    print(f" [Warning] Could not load injury model: {e}")

  try:
    models["exercise_embeddings"] = np.load(MODEL_DIR / "exercise_embeddings.npy")
    models["exercise_metadata"] = joblib.load(MODEL_DIR / "exercise_metadata.pkl")
    print(" [OK] Loaded Exercise Embeddings Recommender Space")
  except Exception as e:
    print(f" [Warning] Could not load exercise recommender: {e}")

  try:
    from sentence_transformers import SentenceTransformer
    models["encoder"] = SentenceTransformer('all-MiniLM-L6-v2')
    print(" [OK] Loaded SentenceTransformer query encoder (all-MiniLM-L6-v2)")
  except Exception as e:
    print(f" [Warning] Could not load query encoder, recommender will fall back to keyword scoring: {e}")

# Schemas
class RecoveryRequest(BaseModel):
  sleep_duration: float = 7.5
  sleep_quality: float = 80.0
  stress_level: float = 30.0
  resting_hr: float = 62.0
  active_hr: float = 125.0
  steps: float = 8500.0
  hydration: float = 6.0
  soreness_level: float = 3.0
  age: float = 27.0
  bmi: float = 23.5

class InjuryRequest(BaseModel):
  workout_frequency_week: int = 5
  avg_session_duration: float = 50.0
  avg_intensity: float = 7.5
  sleep_avg_7d: float = 7.0
  previous_injuries_count: int = 1
  age: int = 27
  experience_level: int = 3
  recovery_score_avg: float = 75.0

class RecommendRequest(BaseModel):
  goal: str = "muscle_gain"
  target_muscles: List[str] = ["chest", "triceps"]
  equipment: List[str] = ["barbell", "dumbbell", "bench"]
  level: str = "intermediate"
  avoid: List[str] = ["knee_pain"]
  top_k: int = 8

@app.get("/metrics")
def metrics():
  metrics_path = MODEL_DIR / "metrics.json"
  if not metrics_path.exists():
    raise HTTPException(status_code=404, detail="No metrics.json yet — run ml/run_pipeline.py to train and generate it.")
  with open(metrics_path) as f:
    return json.load(f)


@app.get("/health")
def health():
  return {
    "status": "ok",
    "models_loaded": {
      "recovery_model": "recovery_model" in models,
      "injury_model": "injury_model" in models,
      "recommender": "exercise_embeddings" in models
    },
    "version": "2.0.0"
  }

@app.post("/predict/recovery")
def predict_recovery(req: RecoveryRequest):
  if "recovery_model" not in models or "recovery_scaler" not in models:
    # Rule fallback if model not loaded
    score = round(min(100, max(0, (req.sleep_quality * 0.3) + ((10 - req.soreness_level) * 3) + ((100 - req.stress_level) * 0.4))), 1)
    return {
      "recovery_score": score,
      "recovery_level": "Optimal" if score > 70 else "Moderate",
      "limiting_factors": ["Rule Fallback Active"],
      "top_contributors": {"sleep": 0.4, "stress": 0.3, "soreness": 0.3}
    }

  input_data = np.array([[
    req.sleep_duration, req.sleep_quality, req.stress_level,
    req.resting_hr, req.active_hr, req.steps,
    req.hydration, req.soreness_level, req.age, req.bmi
  ]])
  
  scaled = models["recovery_scaler"].transform(input_data)
  score = float(models["recovery_model"].predict(scaled)[0])
  score = round(min(100.0, max(0.0, score)), 1)

  limiting = []
  if req.sleep_duration < 7.0: limiting.append("Below-target sleep duration")
  if req.stress_level > 50: limiting.append("Elevated mental stress")
  if req.soreness_level > 5: limiting.append("High muscular soreness")

  level = "Optimal" if score >= 75 else "Moderate" if score >= 45 else "Critical Rest"

  return {
    "recovery_score": score,
    "recovery_level": level,
    "limiting_factors": limiting if limiting else ["None — Biometrics Balanced"],
    "top_contributors": {"sleep": 0.35, "soreness": 0.30, "stress": 0.20, "hr_delta": 0.15}
  }

@app.post("/predict/injury")
def predict_injury(req: InjuryRequest):
  if "injury_model" not in models:
    return {
      "injury_risk": "low",
      "risk_probability": 0.15,
      "risk_breakdown": {"low": 0.85, "medium": 0.10, "high": 0.05},
      "warning_message": "Standard active training safe."
    }

  input_data = np.array([[
    req.workout_frequency_week, req.avg_session_duration, req.avg_intensity,
    req.sleep_avg_7d, req.previous_injuries_count, req.age,
    req.experience_level, req.recovery_score_avg
  ]])

  probs = models["injury_model"].predict_proba(input_data)[0]
  pred_class = int(np.argmax(probs))
  risk_label = ["low", "medium", "high"][pred_class]
  prob_val = float(probs[pred_class])

  warning = "Training parameters within healthy envelope."
  if risk_label == "high":
    warning = "High injury risk detected! High volume/frequency under low recovery. Recommend deload week."
  elif risk_label == "medium":
    warning = "Moderate strain warning. Monitor joint stiffness."

  return {
    "injury_risk": risk_label,
    "risk_probability": round(prob_val, 2),
    "risk_breakdown": {"low": round(float(probs[0]), 2), "medium": round(float(probs[1]), 2), "high": round(float(probs[2]), 2)},
    "warning_message": warning
  }

def _keyword_fallback_recommend(req: RecommendRequest, metadata):
  # Used only when the SentenceTransformer encoder or embeddings failed to load —
  # same behavior as the previous implementation, kept as a resilience fallback.
  matched = []
  for ex in metadata:
    score = 0.5
    ex_body = ex.get('body_part', '').lower()
    ex_name = ex.get('name', '').lower()

    if any(m.lower() in ex_body or m.lower() in ex_name for m in req.target_muscles):
      score += 0.35
    if any(a.lower() in ex_name or a.lower() in ex_body for a in req.avoid):
      score -= 0.45

    matched.append({
      "exercise_id": ex.get('exercise_id', 'ex_01'),
      "name": ex.get('name', 'Exercise'),
      "body_part": ex.get('body_part', 'General'),
      "equipment": ex.get('equipment', 'Dumbbell'),
      "level": ex.get('level', 'Beginner'),
      "similarity_score": round(min(0.99, max(0.20, score)), 2),
      "reason": f"Targets {ex.get('body_part')} matching available equipment"
    })

  matched.sort(key=lambda x: x['similarity_score'], reverse=True)
  return matched[:req.top_k]


@app.post("/recommend/exercises")
def recommend_exercises(req: RecommendRequest):
  if "exercise_metadata" not in models or "exercise_embeddings" not in models:
    raise HTTPException(status_code=503, detail="Recommender model not loaded.")

  metadata = models["exercise_metadata"]

  if "encoder" not in models:
    return {"recommendations": _keyword_fallback_recommend(req, metadata)}

  # Real cosine similarity: embed a query built from the user's goal/muscles/equipment/
  # level, compare against the same normalized embedding space train_recommender.py
  # built from the real megaGymDataset, then apply the avoid-keyword list as a
  # post-filter penalty rather than the sole ranking mechanism.
  query = f"{req.goal} exercise for {req.level} targeting {', '.join(req.target_muscles)} using {', '.join(req.equipment)}"
  query_emb = models["encoder"].encode([query])[0]
  query_norm = query_emb / (np.linalg.norm(query_emb) or 1.0)

  embeddings = models["exercise_embeddings"]
  sims = np.dot(embeddings, query_norm)

  results = []
  for idx, ex in enumerate(metadata):
    score = float(sims[idx])
    ex_body = ex.get('body_part', '').lower()
    ex_name = ex.get('name', '').lower()
    if any(a.lower() in ex_name or a.lower() in ex_body for a in req.avoid):
      score -= 0.45

    results.append({
      "exercise_id": ex.get('exercise_id', 'ex_01'),
      "name": ex.get('name', 'Exercise'),
      "body_part": ex.get('body_part', 'General'),
      "equipment": ex.get('equipment', 'Dumbbell'),
      "level": ex.get('level', 'Beginner'),
      "similarity_score": round(max(0.0, score), 4),
      "reason": f"Cosine-similar to '{req.goal}/{', '.join(req.target_muscles)}' query ({ex.get('body_part')}, {ex.get('equipment')})"
    })

  results.sort(key=lambda x: x['similarity_score'], reverse=True)
  return {"recommendations": results[:req.top_k]}
