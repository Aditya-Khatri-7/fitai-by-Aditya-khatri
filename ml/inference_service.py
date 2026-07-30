import os
import io
import json
import base64
import joblib
import numpy as np
import torch
from pathlib import Path
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import sys
sys.path.append(str(Path(__file__).resolve().parent / "training"))
from cnn_common import build_model, _TRANSFORM

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

  try:
    models["bodyfat_model"] = joblib.load(MODEL_DIR / "bodyfat_predictor.pkl")
    models["bodyfat_scaler"] = joblib.load(MODEL_DIR / "bodyfat_scaler.pkl")
    print(" [OK] Loaded Body Fat % Regressor")
  except Exception as e:
    print(f" [Warning] Could not load body fat model: {e}")

  try:
    models["diabetes_model"] = joblib.load(MODEL_DIR / "diabetes_classifier.pkl")
    models["diabetes_defaults"] = joblib.load(MODEL_DIR / "diabetes_defaults.pkl")
    print(" [OK] Loaded Diabetes Risk Screener")
  except Exception as e:
    print(f" [Warning] Could not load diabetes model: {e}")

  try:
    models["heart_model"] = joblib.load(MODEL_DIR / "heart_classifier.pkl")
    print(" [OK] Loaded Cardio Risk Screener")
  except Exception as e:
    print(f" [Warning] Could not load cardio risk model: {e}")

  # The next 3 models are trained on real data but API-only: the app has no raw
  # accelerometer/IMU/skin-sensor ingestion path today, so there is no live
  # frontend feature built on top of them (see ml plan notes) — they're exposed
  # for completeness and for future wiring once such a data source exists.
  try:
    models["har_model"] = joblib.load(MODEL_DIR / "har_classifier.pkl")
    models["har_label_map"] = joblib.load(MODEL_DIR / "har_label_map.pkl")
    print(" [OK] Loaded Activity Recognition Classifier")
  except Exception as e:
    print(f" [Warning] Could not load HAR model: {e}")

  # Demo samples for the Activity Recognition card. The 561-dim UCI-HAR feature
  # vector can't be entered by hand, so the frontend picks from a small set of
  # real labeled test recordings and sends one back for classification. Built
  # once via ml/training/build_har_demo_samples.py.
  try:
    demo_path = MODEL_DIR / "har_demo_samples.json"
    if demo_path.exists():
      with open(demo_path) as f:
        models["har_demo_samples"] = json.load(f)
      print(f" [OK] Loaded {len(models['har_demo_samples']['samples'])} HAR demo samples")
  except Exception as e:
    print(f" [Warning] Could not load HAR demo samples: {e}")

  try:
    models["knee_rehab_model"] = joblib.load(MODEL_DIR / "knee_rehab_classifier.pkl")
    models["knee_rehab_label_map"] = joblib.load(MODEL_DIR / "knee_rehab_label_map.pkl")
    print(" [OK] Loaded Rehab Recovery Status Classifier (API-only)")
  except Exception as e:
    print(f" [Warning] Could not load knee rehab model: {e}")

  try:
    models["stress_model"] = joblib.load(MODEL_DIR / "stress_classifier.pkl")
    print(" [OK] Loaded Stress Level Classifier")
  except Exception as e:
    print(f" [Warning] Could not load stress model: {e}")

  try:
    models["meal_embeddings"] = np.load(MODEL_DIR / "meal_embeddings.npy")
    models["meal_metadata"] = joblib.load(MODEL_DIR / "meal_metadata.pkl")
    print(" [OK] Loaded Indian Meal Recommender Embeddings")
  except Exception as e:
    print(f" [Warning] Could not load meal recommender: {e}")

  try:
    models["meditation_embeddings"] = np.load(MODEL_DIR / "meditation_embeddings.npy")
    models["meditation_metadata"] = joblib.load(MODEL_DIR / "meditation_metadata.pkl")
    print(" [OK] Loaded Meditation Recommender Embeddings")
  except Exception as e:
    print(f" [Warning] Could not load meditation recommender: {e}")

  try:
    yoga_classes = joblib.load(MODEL_DIR / "yoga_classes.pkl")
    yoga_model = build_model(len(yoga_classes))
    yoga_model.load_state_dict(torch.load(MODEL_DIR / "yoga_classifier.pt", map_location="cpu"))
    yoga_model.eval()
    models["yoga_model"] = yoga_model
    models["yoga_classes"] = yoga_classes
    print(" [OK] Loaded Yoga Pose CNN Classifier")
  except Exception as e:
    print(f" [Warning] Could not load yoga pose model: {e}")

  try:
    food_classes = joblib.load(MODEL_DIR / "food_classes.pkl")
    food_model = build_model(len(food_classes))
    food_model.load_state_dict(torch.load(MODEL_DIR / "food_classifier.pt", map_location="cpu"))
    food_model.eval()
    models["food_model"] = food_model
    models["food_classes"] = food_classes
    print(" [OK] Loaded Indian Food Photo CNN Classifier (20-class beta)")
  except Exception as e:
    print(f" [Warning] Could not load food photo model: {e}")

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

class BodyFatRequest(BaseModel):
  age: float = 27.0
  weight_kg: float = 75.0
  height_cm: float = 175.0
  gender: str = "male"
  neck_cm: Optional[float] = None
  abdomen_cm: Optional[float] = None

class DiabetesScreenRequest(BaseModel):
  age: float = 30.0
  gender: str = "female"
  glucose: float = 100.0
  blood_pressure: float = 75.0
  weight_kg: float = 70.0
  height_cm: float = 165.0
  family_history_diabetes: bool = False
  pregnancies: Optional[int] = None

class CardioScreenRequest(BaseModel):
  age: float = 45.0
  gender: str = "male"
  resting_bp: float = 120.0
  max_hr: float = 150.0
  cholesterol: Optional[float] = None
  chest_pain_symptomatic: bool = False
  exercise_angina: bool = False

class ActivityRequest(BaseModel):
  # Raw UCI HAR 561-length engineered feature vector (order must match
  # ml/models/har_label_map.pkl's feature_cols). API-only — see startup comment.
  features: List[float]

class RehabStatusRequest(BaseModel):
  age: float = 30.0
  gender: str = "male"
  bmi: float = 24.0
  injury_duration_days: float = 30.0
  pain_score: float = 3.0
  rehabilitation_session: float = 10.0
  knee_flexion_angle: float = 100.0
  knee_extension_angle: float = 5.0
  joint_load_n: float = 50.0
  step_length_m: float = 1.0
  stride_time_s: float = 1.0
  gait_speed_mps: float = 1.5
  balance_index: float = 80.0
  muscle_activation_pct: float = 60.0
  heart_rate_bpm: float = 90.0
  fatigue_level: float = 3.0
  sleep_quality: float = 6.0
  exercise_compliance_pct: float = 70.0

class StressSensorRequest(BaseModel):
  skin_humidity: float
  skin_temperature: float
  steps: float

class MealRecommendRequest(BaseModel):
  diet_type: str = "vegetarian"  # 'vegetarian' | 'non vegetarian' | 'vegan'
  cuisine: str = "any"  # 'north' | 'south' | 'east' | 'west' | 'any'
  course: str = "main course"
  goal: str = "balanced"
  top_k: int = 6

class MeditationRecommendRequest(BaseModel):
  mood: str = "stressed"
  focus: str = "stress relief"
  max_duration_mins: Optional[int] = None
  top_k: int = 3

class ImageClassifyRequest(BaseModel):
  image_base64: str  # raw base64 image data, no data-URL prefix required

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
      "recommender": "exercise_embeddings" in models,
      "bodyfat_model": "bodyfat_model" in models,
      "diabetes_model": "diabetes_model" in models,
      "heart_model": "heart_model" in models,
      "har_model": "har_model" in models,
      "knee_rehab_model": "knee_rehab_model" in models,
      "stress_model": "stress_model" in models,
      "meal_recommender": "meal_embeddings" in models,
      "meditation_recommender": "meditation_embeddings" in models,
      "yoga_model": "yoga_model" in models,
      "food_model": "food_model" in models
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

@app.post("/predict/activity")
def predict_activity(req: ActivityRequest):
  if "har_model" not in models:
    raise HTTPException(status_code=503, detail="Activity recognition model not loaded.")

  label_map = models["har_label_map"]
  expected_len = len(label_map["feature_cols"])
  if len(req.features) != expected_len:
    raise HTTPException(status_code=400, detail=f"Expected {expected_len} features, got {len(req.features)}.")

  probs = models["har_model"].predict_proba(np.array([req.features]))[0]
  pred_idx = int(np.argmax(probs))
  return {
    "activity": label_map["classes"][pred_idx],
    "confidence": round(float(probs[pred_idx]), 4),
    "probabilities": {c: round(float(p), 4) for c, p in zip(label_map["classes"], probs)}
  }


class ActivitySampleRequest(BaseModel):
  sample_index: int


@app.get("/demo/activity-samples")
def list_activity_samples():
  """Return the labels + descriptions of the demo HAR recordings, without the
  561-dim feature payload — the frontend picker only needs the labels."""
  if "har_demo_samples" not in models:
    raise HTTPException(status_code=503, detail="HAR demo samples not available.")
  bundle = models["har_demo_samples"]
  return {
    "samples": [
      {"index": i, "true_label": s["true_label"], "description": s.get("description", "")}
      for i, s in enumerate(bundle["samples"])
    ],
    "feature_count": bundle["feature_count"]
  }


@app.post("/demo/classify-activity-sample")
def classify_activity_sample(req: ActivitySampleRequest):
  """Classify one of the pre-loaded HAR test recordings by index. Keeps the
  561-float payload server-side so the browser only needs to send an index."""
  if "har_model" not in models or "har_demo_samples" not in models:
    raise HTTPException(status_code=503, detail="Activity recognition model or demo samples not loaded.")

  samples = models["har_demo_samples"]["samples"]
  if req.sample_index < 0 or req.sample_index >= len(samples):
    raise HTTPException(status_code=400, detail=f"sample_index out of range (0..{len(samples)-1}).")

  sample = samples[req.sample_index]
  label_map = models["har_label_map"]
  probs = models["har_model"].predict_proba(np.array([sample["features"]]))[0]
  pred_idx = int(np.argmax(probs))
  return {
    "activity": label_map["classes"][pred_idx],
    "true_label": sample["true_label"],
    "correct": label_map["classes"][pred_idx] == sample["true_label"],
    "confidence": round(float(probs[pred_idx]), 4),
    "probabilities": {c: round(float(p), 4) for c, p in zip(label_map["classes"], probs)}
  }

@app.post("/predict/rehab-status")
def predict_rehab_status(req: RehabStatusRequest):
  if "knee_rehab_model" not in models:
    raise HTTPException(status_code=503, detail="Rehab status model not loaded.")

  label_map = models["knee_rehab_label_map"]
  input_data = np.array([[
    req.age, 1 if req.gender == 'male' else 0, req.bmi, req.injury_duration_days, req.pain_score,
    req.rehabilitation_session, req.knee_flexion_angle, req.knee_extension_angle, req.joint_load_n,
    req.step_length_m, req.stride_time_s, req.gait_speed_mps, req.balance_index,
    req.muscle_activation_pct, req.heart_rate_bpm, req.fatigue_level, req.sleep_quality,
    req.exercise_compliance_pct
  ]])
  probs = models["knee_rehab_model"].predict_proba(input_data)[0]
  pred_idx = int(np.argmax(probs))
  return {
    "rehab_status": label_map["classes"][pred_idx],
    "confidence": round(float(probs[pred_idx]), 4),
    "probabilities": {c: round(float(p), 4) for c, p in zip(label_map["classes"], probs)}
  }

def _decode_base64_image(image_base64: str) -> Image.Image:
  try:
    raw = image_base64.split(',')[-1]  # tolerate a data:image/...;base64, prefix
    img_bytes = base64.b64decode(raw)
    return Image.open(io.BytesIO(img_bytes)).convert('RGB')
  except Exception:
    raise HTTPException(status_code=400, detail="Could not decode image_base64 — expected a valid base64-encoded image.")


@app.post("/predict/yoga-pose")
def predict_yoga_pose(req: ImageClassifyRequest):
  if "yoga_model" not in models:
    raise HTTPException(status_code=503, detail="Yoga pose model not loaded.")

  img = _decode_base64_image(req.image_base64)
  tensor = _TRANSFORM(img).unsqueeze(0)
  with torch.no_grad():
    probs = torch.softmax(models["yoga_model"](tensor), dim=1)[0].numpy()

  classes = models["yoga_classes"]
  top3_idx = np.argsort(probs)[::-1][:3]
  return {
    "pose": classes[int(top3_idx[0])],
    "confidence": round(float(probs[top3_idx[0]]), 4),
    "top3": [{"pose": classes[int(i)], "confidence": round(float(probs[i]), 4)} for i in top3_idx]
  }


@app.post("/predict/meal-photo")
def predict_meal_photo(req: ImageClassifyRequest):
  if "food_model" not in models:
    raise HTTPException(status_code=503, detail="Meal photo model not loaded.")

  img = _decode_base64_image(req.image_base64)
  tensor = _TRANSFORM(img).unsqueeze(0)
  with torch.no_grad():
    probs = torch.softmax(models["food_model"](tensor), dim=1)[0].numpy()

  classes = models["food_classes"]
  top_idx = int(np.argmax(probs))
  predicted_class = classes[top_idx]
  dish_name_guess = predicted_class.replace('_', ' ')

  nutrition = None
  if "meal_metadata" in models:
    for m in models["meal_metadata"]:
      if str(m.get('name', '')).strip().lower() == dish_name_guess.lower():
        nutrition = {
          "calories_per_100g": m.get('calories_per_100g'), "protein_g": m.get('protein_g'),
          "carbs_g": m.get('carbs_g'), "fat_g": m.get('fat_g'), "fiber_g": m.get('fiber_g'),
          "nutrition_source": m.get('nutrition_source')
        }
        break

  return {
    "dish": dish_name_guess,
    "confidence": round(float(probs[top_idx]), 4),
    "nutrition": nutrition,
    "beta_note": "20-class prototype subset, not a full food recognition benchmark — confirm before logging."
  }


@app.post("/predict/stress-level")
def predict_stress_level(req: StressSensorRequest):
  if "stress_model" not in models:
    raise HTTPException(status_code=503, detail="Stress level model not loaded.")

  input_data = np.array([[req.skin_humidity, req.skin_temperature, req.steps]])
  probs = models["stress_model"].predict_proba(input_data)[0]
  pred_idx = int(np.argmax(probs))
  return {
    "stress_level": ["Low", "Medium", "High"][pred_idx],
    "confidence": round(float(probs[pred_idx]), 4),
    "probabilities": {l: round(float(p), 4) for l, p in zip(["Low", "Medium", "High"], probs)}
  }


# Rough population-average circumferences (cm), used only as a last-resort default
# when the user hasn't filled in the optional Body Composition measurements — using
# broad population figures rather than the training set's own medians keeps this
# fallback self-contained (no extra artifact to load) and its lower confidence is
# always disclosed to the caller via `fields_defaulted`.
_BODYFAT_POPULATION_DEFAULTS = {
  'male': {'neck_cm': 38.0, 'abdomen_cm': 90.0},
  'female': {'neck_cm': 33.0, 'abdomen_cm': 80.0},
}

@app.post("/predict/bodyfat")
def predict_bodyfat(req: BodyFatRequest):
  bmi = req.weight_kg / ((req.height_cm / 100.0) ** 2)
  defaults = _BODYFAT_POPULATION_DEFAULTS.get(req.gender, _BODYFAT_POPULATION_DEFAULTS['male'])

  fields_defaulted = []
  neck_cm = req.neck_cm
  if neck_cm is None:
    neck_cm = defaults['neck_cm']
    fields_defaulted.append('neck_cm')
  abdomen_cm = req.abdomen_cm
  if abdomen_cm is None:
    abdomen_cm = defaults['abdomen_cm']
    fields_defaulted.append('abdomen_cm')

  if "bodyfat_model" not in models or "bodyfat_scaler" not in models:
    # Rule fallback: rough Navy-method approximation (male formula, log-based),
    # honest about being an approximation when the trained model isn't loaded.
    import math
    bf = 495 / (1.0324 - 0.19077 * math.log10(max(abdomen_cm - neck_cm, 1)) + 0.15456 * math.log10(req.height_cm)) - 450
    bf = round(min(60.0, max(2.0, bf)), 1)
    return {"bodyfat_pct": bf, "category": "Unknown", "disclaimer": "Wellness estimate only, model offline — rule-based approximation.", "fields_defaulted": fields_defaulted}

  input_data = np.array([[req.age, req.weight_kg, req.height_cm, bmi, neck_cm, abdomen_cm]])
  scaled = models["bodyfat_scaler"].transform(input_data)
  bf = float(models["bodyfat_model"].predict(scaled)[0])
  bf = round(min(60.0, max(2.0, bf)), 1)

  category = "Essential/Athletic" if bf < 14 else "Fit" if bf < 20 else "Average" if bf < 25 else "Above Average"

  return {
    "bodyfat_pct": bf,
    "category": category,
    "disclaimer": "Estimate only, trained on a dataset of male subjects — treat with extra caution for female users. Not a substitute for DEXA/BIA measurement.",
    "fields_defaulted": fields_defaulted
  }

@app.post("/predict/diabetes-risk")
def predict_diabetes_risk(req: DiabetesScreenRequest):
  bmi = req.weight_kg / ((req.height_cm / 100.0) ** 2)
  defaults = models.get("diabetes_defaults", {"pedigree_low": 0.24, "pedigree_high": 0.68, "pregnancies_median_female": 3.0})

  pregnancies = req.pregnancies
  if pregnancies is None:
    pregnancies = 0 if req.gender == 'male' else defaults['pregnancies_median_female']
  pedigree = defaults['pedigree_high'] if req.family_history_diabetes else defaults['pedigree_low']

  caveat = None
  if req.gender == 'male':
    caveat = "This model is trained on the Pima Indians Diabetes dataset, an all-female cohort — treat results for male users as less validated."

  if "diabetes_model" not in models:
    score = round(min(1.0, max(0.0, (req.glucose - 70) / 130.0)), 2)
    return {
      "risk_level": "elevated" if score > 0.5 else "low", "probability": score,
      "disclaimer": "Wellness screening only — not a medical diagnosis. Consult a healthcare provider. (Model offline, rule fallback active.)",
      "caveat_note": caveat
    }

  input_data = np.array([[pregnancies, req.glucose, req.blood_pressure, bmi, pedigree, req.age]])
  prob = float(models["diabetes_model"].predict_proba(input_data)[0][1])
  risk_level = "elevated" if prob >= 0.5 else "low"

  return {
    "risk_level": risk_level,
    "probability": round(prob, 2),
    "disclaimer": "Wellness screening only — not a medical diagnosis. Consult a healthcare provider.",
    "caveat_note": caveat
  }

@app.post("/predict/cardio-risk")
def predict_cardio_risk(req: CardioScreenRequest):
  # Population-typical cholesterol default (borderline-normal, mg/dL) when the user
  # hasn't entered a lab value — disclosed via the response, same pattern as bodyfat.
  cholesterol = req.cholesterol if req.cholesterol is not None else 200.0
  sex_male = 1 if req.gender == 'male' else 0

  if "heart_model" not in models:
    score = round(min(1.0, max(0.0, (req.resting_bp - 100) / 100.0)), 2)
    return {
      "risk_level": "elevated" if score > 0.5 else "low", "probability": score,
      "disclaimer": "Wellness screening only — not a medical diagnosis. Consult a healthcare provider. (Model offline, rule fallback active.)",
      "fields_defaulted": [] if req.cholesterol is not None else ["cholesterol"]
    }

  input_data = np.array([[req.age, sex_male, req.resting_bp, req.max_hr, int(req.chest_pain_symptomatic), int(req.exercise_angina), cholesterol]])
  prob = float(models["heart_model"].predict_proba(input_data)[0][1])
  risk_level = "elevated" if prob >= 0.5 else "low"

  return {
    "risk_level": risk_level,
    "probability": round(prob, 2),
    "disclaimer": "Wellness screening only — not a medical diagnosis. Consult a healthcare provider.",
    "fields_defaulted": [] if req.cholesterol is not None else ["cholesterol"]
  }


# Maps the app's stored equipment vocabulary (backend/frontend EquipmentSelector
# values, lowercase snake_case) to megaGymDataset's Equipment column values (Title
# Case). "Body Only" exercises need no gear and are always allowed regardless of
# what the user owns.
_EQUIPMENT_SYNONYMS = {
  'dumbbell': 'Dumbbell', 'dumbbells': 'Dumbbell',
  'barbell': 'Barbell',
  'cable': 'Cable', 'cable_machine': 'Cable',
  'machine': 'Machine',
  'kettlebell': 'Kettlebells', 'kettlebells': 'Kettlebells',
  'resistance_band': 'Bands', 'bands': 'Bands', 'resistance_bands': 'Bands',
  'medicine_ball': 'Medicine Ball',
  'exercise_ball': 'Exercise Ball', 'stability_ball': 'Exercise Ball',
  'ez_curl_bar': 'E-Z Curl Bar',
  'foam_roll': 'Foam Roll', 'foam_roller': 'Foam Roll',
  'bodyweight_only': 'Body Only', 'bodyweight': 'Body Only',
  'pull_up_bar': 'Other', 'bench': 'Other', 'rack': 'Other'
}
_ALWAYS_ALLOWED_EQUIPMENT = {'body only', 'other'}


def _normalize_equipment_set(user_equipment):
  normalized = set()
  for item in user_equipment or []:
    key = str(item).strip().lower().replace(' ', '_')
    normalized.add(_EQUIPMENT_SYNONYMS.get(key, str(item).strip().lower()))
  return normalized


def _equipment_available(exercise_equipment, allowed_equipment_lower):
  ex_eq = str(exercise_equipment or '').strip().lower()
  if not ex_eq or ex_eq in _ALWAYS_ALLOWED_EQUIPMENT:
    return True
  return ex_eq in {a.lower() for a in allowed_equipment_lower}


def _keyword_fallback_recommend(req: RecommendRequest, metadata):
  # Used only when the SentenceTransformer encoder or embeddings failed to load —
  # same behavior as the previous implementation, kept as a resilience fallback.
  allowed_equipment = _normalize_equipment_set(req.equipment)
  matched = []
  for ex in metadata:
    if not _equipment_available(ex.get('equipment', ''), allowed_equipment):
      continue

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
      "desc": ex.get('desc', ''),
      "similarity_score": round(min(0.99, max(0.20, score)), 2),
      "reason": f"Targets {ex.get('body_part')} matching available equipment"
    })

  matched.sort(key=lambda x: x['similarity_score'], reverse=True)
  return matched[:req.top_k]


def _diet_allowed(dish_diet, is_vegan_friendly, diet_type):
  diet_type = (diet_type or '').strip().lower()
  if diet_type == 'vegan':
    return bool(is_vegan_friendly)
  if diet_type == 'vegetarian':
    return dish_diet == 'vegetarian'
  return True  # non-vegetarian / omnivore users can eat anything, including veg dishes


def _clean_nan(obj):
  """Recursively replace float nan/inf with None so JSON serialization never fails."""
  import math
  if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
    return None
  if isinstance(obj, dict):
    return {k: _clean_nan(v) for k, v in obj.items()}
  if isinstance(obj, list):
    return [_clean_nan(v) for v in obj]
  return obj


@app.post("/recommend/meals")
def recommend_meals(req: MealRecommendRequest):
  if "meal_metadata" not in models or "meal_embeddings" not in models:
    raise HTTPException(status_code=503, detail="Meal recommender not loaded.")

  metadata = models["meal_metadata"]
  embeddings = models["meal_embeddings"]

  if "encoder" not in models:
    # Keyword fallback, mirrors the exercise recommender's resilience pattern.
    matched = [m for m in metadata if _diet_allowed(m['diet'], m['is_vegan_friendly'], req.diet_type)]
    return {"recommendations": matched[:req.top_k]}

  query = f"{req.goal} {req.diet_type} {req.course} from {req.cuisine} Indian cuisine"
  query_emb = models["encoder"].encode([query])[0]
  query_norm = query_emb / (np.linalg.norm(query_emb) or 1.0)
  sims = np.dot(embeddings, query_norm)

  results = []
  for idx, m in enumerate(metadata):
    if not _diet_allowed(m['diet'], m['is_vegan_friendly'], req.diet_type):
      continue
    score = float(sims[idx])
    if req.cuisine and req.cuisine != 'any' and str(m.get('region', '')).lower().startswith(req.cuisine.lower()):
      score += 0.08
    if req.course and str(m.get('course', '')).lower() == req.course.lower():
      score += 0.05
    results.append({**m, "similarity_score": round(max(0.0, score), 4)})

  results.sort(key=lambda x: x['similarity_score'], reverse=True)
  return {"recommendations": results[:req.top_k]}


@app.post("/recommend/meditation")
def recommend_meditation(req: MeditationRecommendRequest):
  if "meditation_metadata" not in models or "meditation_embeddings" not in models:
    raise HTTPException(status_code=503, detail="Meditation recommender not loaded.")

  metadata = models["meditation_metadata"]
  embeddings = models["meditation_embeddings"]

  if "encoder" not in models:
    return {"recommendations": metadata[:req.top_k]}

  query = f"{req.mood} needing {req.focus}"
  query_emb = models["encoder"].encode([query])[0]
  query_norm = query_emb / (np.linalg.norm(query_emb) or 1.0)
  sims = np.dot(embeddings, query_norm)

  results = [{**m, "similarity_score": round(float(sims[idx]), 4)} for idx, m in enumerate(metadata)]
  results.sort(key=lambda x: x['similarity_score'], reverse=True)
  return {"recommendations": results[:req.top_k]}


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

  allowed_equipment = _normalize_equipment_set(req.equipment)

  results = []
  for idx, ex in enumerate(metadata):
    ex_equipment = ex.get('equipment', '')
    # Hard filter, not just a similarity nudge — an exercise the user has no gear for
    # should never surface, regardless of how well it scores semantically.
    if not _equipment_available(ex_equipment, allowed_equipment):
      continue

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
      "desc": ex.get('desc', ''),
      "similarity_score": round(max(0.0, score), 4),
      "reason": f"Cosine-similar to '{req.goal}/{', '.join(req.target_muscles)}' query ({ex.get('body_part')}, {ex.get('equipment')})"
    })

  results.sort(key=lambda x: x['similarity_score'], reverse=True)
  return {"recommendations": results[:req.top_k]}
