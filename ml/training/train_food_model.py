import sys
import pandas as pd
import joblib
import torch
import matplotlib.pyplot as plt
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from cnn_common import train_image_classifier

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = BASE_DIR / "datasets" / "processed"
MODEL_DIR = BASE_DIR / "ml" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

def train_food_model():
  train_df = pd.read_csv(PROCESSED_DIR / "food_train_manifest.csv")
  val_df = pd.read_csv(PROCESSED_DIR / "food_val_manifest.csv")
  test_df = pd.read_csv(PROCESSED_DIR / "food_test_manifest.csv")
  class_names = joblib.load(PROCESSED_DIR / "food_classes.pkl")

  result = train_image_classifier("Indian Food Photo Classifier (20-class subset)", train_df, val_df, test_df, class_names, epochs=12, batch_size=32)

  torch.save(result["model"].state_dict(), MODEL_DIR / "food_classifier.pt")
  joblib.dump(class_names, MODEL_DIR / "food_classes.pkl")

  fig, ax = plt.subplots(figsize=(10, 9))
  ax.imshow(result["confusion_matrix"], cmap='Greens')
  ax.set_xticks(range(len(class_names))); ax.set_yticks(range(len(class_names)))
  ax.set_xticklabels(class_names, rotation=90); ax.set_yticklabels(class_names)
  plt.title("Indian Food Photo Confusion Matrix (held-out test split)")
  plt.tight_layout()
  plt.savefig(MODEL_DIR / "food_confusion_matrix.png")
  plt.close()

  print(f" [SAVED] Model: food_classifier.pt & Classes: food_classes.pkl (20-class beta subset, not full Food-101)")
  return {"accuracy": result["test_accuracy"], "f1": result["f1"]}

if __name__ == "__main__":
  train_food_model()
