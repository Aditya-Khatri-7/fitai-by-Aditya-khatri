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

def train_heart_model():
  print("[Model] Training XGBoost Cardiovascular Risk Screener...")

  train_df = pd.read_csv(PROCESSED_DIR / "heart_train.csv")
  val_df = pd.read_csv(PROCESSED_DIR / "heart_val.csv")
  test_df = pd.read_csv(PROCESSED_DIR / "heart_test.csv")

  features = ['age', 'sex_male', 'resting_bp', 'max_hr', 'chest_pain_symptomatic', 'exercise_angina', 'cholesterol']
  target = 'cardio_risk'

  X_train, y_train = train_df[features], train_df[target]
  X_val, y_val = val_df[features], val_df[target]
  X_test, y_test = test_df[features], test_df[target]

  model = xgb.XGBClassifier(
    objective='binary:logistic',
    n_estimators=200,
    max_depth=4,
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
  print("   CARDIO RISK MODEL METRICS                       ")
  print("==================================================")
  print(classification_report(y_test, preds, target_names=['Low Risk', 'Elevated Risk']))
  print(f" Weighted F1 Score: {f1:.4f}")
  print("==================================================\n")

  joblib.dump(model, MODEL_DIR / "heart_classifier.pkl")
  joblib.dump(features, MODEL_DIR / "heart_features.pkl")

  fig, ax = plt.subplots(figsize=(6, 5))
  im = ax.imshow(cm, cmap='Reds')
  ax.set_xticks([0, 1]); ax.set_yticks([0, 1])
  ax.set_xticklabels(['Low', 'Elevated']); ax.set_yticklabels(['Low', 'Elevated'])
  plt.title("Cardio Risk Confusion Matrix")
  plt.tight_layout()
  plt.savefig(MODEL_DIR / "heart_confusion_matrix.png")
  plt.close()

  print(f" [SAVED] Model: heart_classifier.pkl")
  return {"f1": f1}

if __name__ == "__main__":
  train_heart_model()
