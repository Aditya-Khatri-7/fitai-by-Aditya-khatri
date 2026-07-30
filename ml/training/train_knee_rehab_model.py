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

def train_knee_rehab_model():
  print("[Model] Training XGBoost Rehab Recovery Status Classifier (knee IMU/gait sensor data)...")

  train_df = pd.read_csv(PROCESSED_DIR / "knee_rehab_train.csv")
  val_df = pd.read_csv(PROCESSED_DIR / "knee_rehab_val.csv")
  test_df = pd.read_csv(PROCESSED_DIR / "knee_rehab_test.csv")
  label_map = joblib.load(PROCESSED_DIR / "knee_rehab_label_map.pkl")
  classes = label_map["classes"]

  features = [c for c in train_df.columns if c != 'rehab_status']
  X_train, y_train = train_df[features], train_df['rehab_status']
  X_val, y_val = val_df[features], val_df['rehab_status']
  X_test, y_test = test_df[features], test_df['rehab_status']

  model = xgb.XGBClassifier(
    objective='multi:softprob',
    num_class=len(classes),
    n_estimators=250,
    max_depth=5,
    learning_rate=0.08,
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
  print("   REHAB RECOVERY STATUS MODEL METRICS             ")
  print("==================================================")
  print(classification_report(y_test, preds, target_names=classes))
  print(f" Weighted F1 Score: {f1:.4f}")
  print("==================================================\n")

  joblib.dump(model, MODEL_DIR / "knee_rehab_classifier.pkl")
  joblib.dump({"classes": classes, "features": features}, MODEL_DIR / "knee_rehab_label_map.pkl")

  fig, ax = plt.subplots(figsize=(6, 5))
  im = ax.imshow(cm, cmap='Greens')
  ax.set_xticks(range(len(classes))); ax.set_yticks(range(len(classes)))
  ax.set_xticklabels(classes); ax.set_yticklabels(classes)
  plt.title("Rehab Recovery Status Confusion Matrix")
  plt.tight_layout()
  plt.savefig(MODEL_DIR / "knee_rehab_confusion_matrix.png")
  plt.close()

  print(f" [SAVED] Model: knee_rehab_classifier.pkl (API-only: needs IMU/gait sensor input the app doesn't capture)")
  return {"f1": f1}

if __name__ == "__main__":
  train_knee_rehab_model()
