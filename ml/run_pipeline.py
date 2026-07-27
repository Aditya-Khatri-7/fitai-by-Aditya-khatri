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

def main():
  start_time = time.time()
  print("\n==================================================")
  print("      FitAI Master ML Training Pipeline           ")
  print("==================================================\n")

  # Step 1: Preprocessing
  run_preprocess()

  # Step 2: Model 1 - Recovery Regressor
  print("\n--- Training Model 1: Recovery Score Regressor ---")
  rec_metrics = train_recovery_model()

  # Step 3: Model 2 - Injury Classifier
  print("\n--- Training Model 2: Injury Risk Classifier ---")
  inj_metrics = train_injury_model()

  # Step 4: Model 3 - Exercise Recommender
  print("\n--- Training Model 3: Exercise Recommender ---")
  rec_sim = train_recommender()

  elapsed = (time.time() - start_time) / 60.0

  # Persisted so inference_service.py can serve real, current metrics via /metrics
  # instead of the frontend showing a hardcoded snapshot that goes stale on retrain.
  metrics = {
    "recovery": {"mae": rec_metrics['mae'], "rmse": rec_metrics['rmse'], "r2": rec_metrics['r2']},
    "injury": {"f1": inj_metrics['f1']},
    "recommender": {"count": rec_sim['count'], "embedding_dim": 384, "encoder": "all-MiniLM-L6-v2"},
    "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
  }
  with open(BASE_DIR / "models" / "metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

  print("\n=================== TRAINING COMPLETE ===================")
  print(f" Recovery Model:    MAE={rec_metrics['mae']:.2f}, R²={rec_metrics['r2']:.2f}     [SAVED]")
  print(f" Injury Classifier: F1={inj_metrics['f1']:.2f}                     [SAVED]")
  print(f" Exercise Recommender: {rec_sim['count']} embeddings            [SAVED]")
  print(f" Total training time: {elapsed:.2f} minutes")
  print(f" Models saved to: {BASE_DIR / 'models'}")
  print(f" Next step: uvicorn inference_service:app --host 0.0.0.0 --port 8001")
  print("=========================================================\n")

if __name__ == "__main__":
  main()
