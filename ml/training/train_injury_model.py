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

def train_injury_model():
  print("[Model 2/3] Training XGBoost Injury Risk Multi-Class Classifier...")

  train_df = pd.read_csv(PROCESSED_DIR / "injury_train.csv")
  val_df = pd.read_csv(PROCESSED_DIR / "injury_val.csv")
  test_df = pd.read_csv(PROCESSED_DIR / "injury_test.csv")

  features = ['workout_frequency_week', 'avg_session_duration', 'avg_intensity', 'sleep_avg_7d', 'previous_injuries_count', 'age', 'experience_level', 'recovery_score_avg']
  target = 'injury_risk'

  X_train, y_train = train_df[features], train_df[target]
  X_val, y_val = val_df[features], val_df[target]
  X_test, y_test = test_df[features], test_df[target]

  model = xgb.XGBClassifier(
    objective='multi:softprob',
    num_class=3,
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
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
  print("   INJURY MODEL CLASSIFICATION METRICS            ")
  print("==================================================")
  print(classification_report(y_test, preds, target_names=['Low Risk', 'Medium Risk', 'High Risk']))
  print(f" Weighted F1 Score: {f1:.4f}")
  print("==================================================\n")

  # Save artifacts
  joblib.dump(model, MODEL_DIR / "injury_classifier.pkl")
  joblib.dump(features, MODEL_DIR / "injury_features.pkl")

  # Save Confusion Matrix Plot
  fig, ax = plt.subplots(figsize=(6, 5))
  im = ax.imshow(cm, cmap='Purples')
  ax.set_xticks([0, 1, 2]); ax.set_yticks([0, 1, 2])
  ax.set_xticklabels(['Low', 'Med', 'High']); ax.set_yticklabels(['Low', 'Med', 'High'])
  plt.title("Injury Risk Confusion Matrix")
  plt.tight_layout()
  plt.savefig(MODEL_DIR / "injury_confusion_matrix.png")
  plt.close()

  print(f" [SAVED] Model: injury_classifier.pkl & Features: injury_features.pkl")
  return {"f1": f1}

if __name__ == "__main__":
  train_injury_model()
