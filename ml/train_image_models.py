import sys
import json
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

from training.preprocess import preprocess_yoga_manifest, preprocess_food_manifest
from training.train_yoga_model import train_yoga_model
from training.train_food_model import train_food_model

METRICS_PATH = BASE_DIR / "models" / "metrics.json"


def _update_metrics(patch):
  metrics = {}
  if METRICS_PATH.exists():
    with open(METRICS_PATH) as f:
      metrics = json.load(f)
  metrics.update(patch)
  metrics["trained_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
  with open(METRICS_PATH, "w") as f:
    json.dump(metrics, f, indent=2)


def main():
  # Separate entry point from run_pipeline.py deliberately: CNN training takes
  # minutes even on small datasets (CPU-only, no GPU in this environment), so
  # routine tabular-model retrains shouldn't have to pay that cost every time.
  print("\n=== FitAI Image Model Training (Yoga + Indian Food Photos) ===\n")

  print("--- Preprocessing image manifests ---")
  preprocess_yoga_manifest()
  preprocess_food_manifest()

  print("\n--- Training Yoga Pose Classifier ---")
  yoga_metrics = train_yoga_model()
  _update_metrics({"yoga_pose": {"accuracy": yoga_metrics['accuracy'], "f1": yoga_metrics['f1']}})

  print("\n--- Training Indian Food Photo Classifier (20-class beta) ---")
  food_metrics = train_food_model()
  _update_metrics({"meal_photo": {"accuracy": food_metrics['accuracy'], "f1": food_metrics['f1'], "classes": 20, "note": "beta subset, not full Food-101"}})

  print("\n=== Image model training complete ===")
  print(f" Yoga Pose Classifier: accuracy={yoga_metrics['accuracy']:.2f}, F1={yoga_metrics['f1']:.2f}")
  print(f" Food Photo Classifier: accuracy={food_metrics['accuracy']:.2f}, F1={food_metrics['f1']:.2f}")


if __name__ == "__main__":
  main()
