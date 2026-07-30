import os
import sys
import time
import json
from pathlib import Path

# Add current directory to path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

from training.preprocess import main as run_preprocess
from training.train_recovery_model import train_recovery_model
from training.train_injury_model import train_injury_model
from training.train_recommender import train_recommender
from training.train_bodyfat_model import train_bodyfat_model
from training.train_diabetes_model import train_diabetes_model
from training.train_heart_model import train_heart_model
from training.train_har_model import train_har_model
from training.train_knee_rehab_model import train_knee_rehab_model
from training.train_stress_model import train_stress_model
from training.train_meal_recommender import train_meal_recommender
from training.train_meditation_recommender import train_meditation_recommender

METRICS_PATH = None  # set in main() once BASE_DIR is known


def _save_metrics(metrics):
  # Written incrementally after every model rather than once at the very end, so a
  # failure partway through the pipeline (e.g. a later schema-contingent or
  # image-training step) doesn't discard already-computed real metrics.
  metrics["trained_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
  with open(METRICS_PATH, "w") as f:
    json.dump(metrics, f, indent=2)


def main():
  global METRICS_PATH
  METRICS_PATH = BASE_DIR / "models" / "metrics.json"
  metrics = {}

  start_time = time.time()
  print("\n==================================================")
  print("      FitAI Master ML Training Pipeline           ")
  print("==================================================\n")

  # Step 1: Preprocessing
  run_preprocess()

  print("\n--- Training Model 1: Recovery Score Regressor ---")
  rec_metrics = train_recovery_model()
  metrics["recovery"] = {"mae": rec_metrics['mae'], "rmse": rec_metrics['rmse'], "r2": rec_metrics['r2']}
  _save_metrics(metrics)

  print("\n--- Training Model 2: Injury Risk Classifier ---")
  inj_metrics = train_injury_model()
  metrics["injury"] = {"f1": inj_metrics['f1']}
  _save_metrics(metrics)

  print("\n--- Training Model 3: Exercise Recommender ---")
  rec_sim = train_recommender()
  metrics["recommender"] = {"count": rec_sim['count'], "embedding_dim": 384, "encoder": "all-MiniLM-L6-v2"}
  _save_metrics(metrics)

  print("\n--- Training Model 4: Body Fat % Regressor ---")
  try:
    bf_metrics = train_bodyfat_model()
    metrics["bodyfat"] = {"mae": bf_metrics['mae'], "rmse": bf_metrics['rmse'], "r2": bf_metrics['r2']}
  except Exception as e:
    print(f" [SKIPPED] Body fat model failed: {e}")
  _save_metrics(metrics)

  print("\n--- Training Model 5: Diabetes Risk Screener ---")
  try:
    diab_metrics = train_diabetes_model()
    metrics["diabetes_risk"] = {"f1": diab_metrics['f1']}
  except Exception as e:
    print(f" [SKIPPED] Diabetes model failed: {e}")
  _save_metrics(metrics)

  print("\n--- Training Model 6: Cardio Risk Screener ---")
  try:
    heart_metrics = train_heart_model()
    metrics["cardio_risk"] = {"f1": heart_metrics['f1']}
  except Exception as e:
    print(f" [SKIPPED] Cardio risk model failed: {e}")
  _save_metrics(metrics)

  print("\n--- Training Model 7: Activity Recognition (HAR, API-only) ---")
  try:
    har_metrics = train_har_model()
    metrics["activity_recognition"] = {"f1": har_metrics['f1']}
  except Exception as e:
    print(f" [SKIPPED] HAR model failed: {e}")
  _save_metrics(metrics)

  print("\n--- Training Model 8: Rehab Recovery Status (knee sensor, API-only) ---")
  try:
    rehab_metrics = train_knee_rehab_model()
    metrics["rehab_status"] = {"f1": rehab_metrics['f1']}
  except Exception as e:
    print(f" [SKIPPED] Knee rehab model failed: {e}")
  _save_metrics(metrics)

  print("\n--- Training Model 9: Stress Level (wearable sensor, API-only) ---")
  try:
    stress_metrics = train_stress_model()
    metrics["stress_level"] = {"f1": stress_metrics['f1']}
  except Exception as e:
    print(f" [SKIPPED] Stress model failed: {e}")
  _save_metrics(metrics)

  print("\n--- Training Model 10: Indian Meal Recommender ---")
  try:
    meal_metrics = train_meal_recommender()
    metrics["meal_recommender"] = {"count": meal_metrics['count'], "embedding_dim": 384, "encoder": "all-MiniLM-L6-v2"}
  except Exception as e:
    print(f" [SKIPPED] Meal recommender failed: {e}")
  _save_metrics(metrics)

  print("\n--- Training Model 11: Meditation Recommender ---")
  try:
    med_metrics = train_meditation_recommender()
    metrics["meditation_recommender"] = {"count": med_metrics['count'], "embedding_dim": 384, "encoder": "all-MiniLM-L6-v2"}
  except Exception as e:
    print(f" [SKIPPED] Meditation recommender failed: {e}")
  _save_metrics(metrics)

  elapsed = (time.time() - start_time) / 60.0

  print("\n=================== TRAINING COMPLETE ===================")
  print(f" Recovery Model:    MAE={rec_metrics['mae']:.2f}, R²={rec_metrics['r2']:.2f}     [SAVED]")
  print(f" Injury Classifier: F1={inj_metrics['f1']:.2f}                     [SAVED]")
  print(f" Exercise Recommender: {rec_sim['count']} embeddings            [SAVED]")
  if 'bodyfat' in metrics: print(f" Body Fat Regressor: R²={metrics['bodyfat']['r2']:.2f}                     [SAVED]")
  if 'diabetes_risk' in metrics: print(f" Diabetes Screener:  F1={metrics['diabetes_risk']['f1']:.2f}                     [SAVED]")
  if 'cardio_risk' in metrics: print(f" Cardio Screener:    F1={metrics['cardio_risk']['f1']:.2f}                     [SAVED]")
  print(f" Total training time: {elapsed:.2f} minutes")
  print(f" Models saved to: {BASE_DIR / 'models'}")
  print(f" Next step: uvicorn inference_service:app --host 0.0.0.0 --port 8001")
  print("=========================================================\n")

if __name__ == "__main__":
  main()
