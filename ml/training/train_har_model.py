import os
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
from pathlib import Path
from sklearn.metrics import classification_report, f1_score, confusion_matrix
import xgboost as xgb

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = BASE_DIR / "datasets" / "processed"
MODEL_DIR = BASE_DIR / "ml" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

def train_har_model():
  print("[Model] Training XGBoost Activity Recognition Classifier (UCI HAR)...")

  train_df = pd.read_csv(PROCESSED_DIR / "har_train.csv")
  val_df = pd.read_csv(PROCESSED_DIR / "har_val.csv")
  test_df = pd.read_csv(PROCESSED_DIR / "har_test.csv")
  label_map = joblib.load(PROCESSED_DIR / "har_label_map.pkl")
  classes, feature_cols = label_map["classes"], label_map["feature_cols"]

  X_train, y_train = train_df[feature_cols], train_df['activity']
  X_val, y_val = val_df[feature_cols], val_df['activity']
  X_test, y_test = test_df[feature_cols], test_df['activity']

  model = xgb.XGBClassifier(
    objective='multi:softprob',
    num_class=len(classes),
    n_estimators=300,
    max_depth=6,
    learning_rate=0.1,
    random_state=42
  )

  model.fit(
    X_train, y_train,
    eval_set=[(X_val, y_val)],
    verbose=False
  )

  preds = model.predict(X_test)
  f1 = f1_score(y_test, preds, average='weighted')
  cm = confusion_matrix(y_test, preds)

  print("\n==================================================")
  print("   ACTIVITY RECOGNITION MODEL METRICS (held-out subjects) ")
  print("==================================================")
  print(classification_report(y_test, preds, target_names=classes))
  print(f" Weighted F1 Score: {f1:.4f}")
  print("==================================================\n")

  joblib.dump(model, MODEL_DIR / "har_classifier.pkl")
  joblib.dump({"classes": classes, "feature_cols": feature_cols}, MODEL_DIR / "har_label_map.pkl")

  fig, ax = plt.subplots(figsize=(7, 6))
  im = ax.imshow(cm, cmap='Blues')
  ax.set_xticks(range(len(classes))); ax.set_yticks(range(len(classes)))
  ax.set_xticklabels(classes, rotation=45, ha='right'); ax.set_yticklabels(classes)
  plt.title("Activity Recognition Confusion Matrix (held-out subjects)")
  plt.tight_layout()
  plt.savefig(MODEL_DIR / "har_confusion_matrix.png")
  plt.close()

  print(f" [SAVED] Model: har_classifier.pkl (API-only: no raw accelerometer ingestion exists in the app yet)")
  return {"f1": f1}

if __name__ == "__main__":
  train_har_model()
