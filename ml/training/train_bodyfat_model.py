import os
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
from pathlib import Path
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = BASE_DIR / "datasets" / "processed"
MODEL_DIR = BASE_DIR / "ml" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

def train_bodyfat_model():
  print("[Model] Training XGBoost Body Fat % Regressor...")

  train_df = pd.read_csv(PROCESSED_DIR / "bodyfat_train.csv")
  val_df = pd.read_csv(PROCESSED_DIR / "bodyfat_val.csv")
  test_df = pd.read_csv(PROCESSED_DIR / "bodyfat_test.csv")

  features = ['age', 'weight_kg', 'height_cm', 'bmi', 'neck_cm', 'abdomen_cm']
  target = 'bodyfat_pct'

  X_train, y_train = train_df[features], train_df[target]
  X_val, y_val = val_df[features], val_df[target]
  X_test, y_test = test_df[features], test_df[target]

  scaler = StandardScaler()
  X_train_scaled = scaler.fit_transform(X_train)
  X_val_scaled = scaler.transform(X_val)
  X_test_scaled = scaler.transform(X_test)

  model = xgb.XGBRegressor(
    objective='reg:squarederror',
    n_estimators=200,
    max_depth=4,
    learning_rate=0.05,
    random_state=42
  )

  model.fit(
    X_train_scaled, y_train,
    eval_set=[(X_val_scaled, y_val)],
    verbose=False
  )

  preds = model.predict(X_test_scaled)
  mae = mean_absolute_error(y_test, preds)
  rmse = np.sqrt(mean_squared_error(y_test, preds))
  r2 = r2_score(y_test, preds)

  print("\n==================================================")
  print("   BODY FAT MODEL EVALUATION METRICS               ")
  print("==================================================")
  print(f" Mean Absolute Error (MAE) : {mae:.4f}")
  print(f" Root Mean Sq Error (RMSE) : {rmse:.4f}")
  print(f" R² Accuracy Score        : {r2:.4f}")
  print("==================================================\n")

  joblib.dump(model, MODEL_DIR / "bodyfat_predictor.pkl")
  joblib.dump(scaler, MODEL_DIR / "bodyfat_scaler.pkl")
  joblib.dump(features, MODEL_DIR / "bodyfat_features.pkl")

  fig, ax = plt.subplots(figsize=(8, 5))
  xgb.plot_importance(model, ax=ax, height=0.5, title="Body Fat Model Feature Importance")
  plt.tight_layout()
  plt.savefig(MODEL_DIR / "bodyfat_feature_importance.png")
  plt.close()

  print(f" [SAVED] Model: bodyfat_predictor.pkl & Scaler: bodyfat_scaler.pkl")
  return {"mae": mae, "rmse": rmse, "r2": r2}

if __name__ == "__main__":
  train_bodyfat_model()
