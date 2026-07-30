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

def train_stress_model():
  print("[Model] Training XGBoost Stress Level Classifier (Stress-Lysis wearable data)...")

  train_df = pd.read_csv(PROCESSED_DIR / "stress_train.csv")
  val_df = pd.read_csv(PROCESSED_DIR / "stress_val.csv")
  test_df = pd.read_csv(PROCESSED_DIR / "stress_test.csv")

  features = ['skin_humidity', 'skin_temperature', 'steps']
  target = 'stress_level'

  X_train, y_train = train_df[features], train_df[target]
  X_val, y_val = val_df[features], val_df[target]
  X_test, y_test = test_df[features], test_df[target]

  model = xgb.XGBClassifier(
    objective='multi:softprob',
    num_class=3,
    n_estimators=200,
    max_depth=4,
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
  print("   STRESS LEVEL MODEL METRICS                      ")
  print("==================================================")
  print(classification_report(y_test, preds, target_names=['Low', 'Medium', 'High']))
  print(f" Weighted F1 Score: {f1:.4f}")
  print("==================================================\n")

  joblib.dump(model, MODEL_DIR / "stress_classifier.pkl")
  joblib.dump(features, MODEL_DIR / "stress_features.pkl")

  fig, ax = plt.subplots(figsize=(6, 5))
  im = ax.imshow(cm, cmap='Purples')
  ax.set_xticks([0, 1, 2]); ax.set_yticks([0, 1, 2])
  ax.set_xticklabels(['Low', 'Med', 'High']); ax.set_yticklabels(['Low', 'Med', 'High'])
  plt.title("Stress Level Confusion Matrix")
  plt.tight_layout()
  plt.savefig(MODEL_DIR / "stress_confusion_matrix.png")
  plt.close()

  print(f" [SAVED] Model: stress_classifier.pkl (API-only: needs skin humidity/temperature sensor input the app doesn't capture)")
  return {"f1": f1}

if __name__ == "__main__":
  train_stress_model()
