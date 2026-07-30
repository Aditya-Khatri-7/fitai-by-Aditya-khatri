"""Pull one representative row per activity class from the UCI-HAR test split
and dump them as ml/models/har_demo_samples.json.

The Activity Recognition classifier's input is a 561-dim engineered feature
vector that no human can enter by hand — so the app ships a small set of
labeled test samples the user can pick from to see the model classify a real
recording. Regenerate this file after re-preprocessing HAR data.
"""
import json
from pathlib import Path
import joblib
import pandas as pd

BASE = Path(__file__).resolve().parent.parent
LABEL_MAP = joblib.load(BASE / "models" / "har_label_map.pkl")
TEST_CSV = BASE.parent / "datasets" / "processed" / "har_test.csv"

df = pd.read_csv(TEST_CSV)
feature_cols = LABEL_MAP["feature_cols"]
classes = LABEL_MAP["classes"]

# Human-readable descriptions shown next to each sample in the picker.
DESCRIPTIONS = {
  "LAYING": "Volunteer lying still on a bed (accelerometer near-zero variance).",
  "SITTING": "Volunteer seated on a chair, minimal upper-body motion.",
  "STANDING": "Volunteer standing upright, small postural sway.",
  "WALKING": "Volunteer walking on level ground at normal cadence.",
  "WALKING_UPSTAIRS": "Volunteer ascending a staircase, higher vertical acceleration.",
  "WALKING_DOWNSTAIRS": "Volunteer descending a staircase, characteristic gait signature."
}

samples = []
# The preprocessing pipeline stores the label as an integer 0..5, aligned to the
# classes list order (LAYING=0, SITTING=1, ...). Fall back to a string match in
# case a future re-preprocess keeps the raw activity name instead.
label_col = "activity"
for cls_idx, cls_name in enumerate(classes):
  match = df[df[label_col] == cls_idx]
  if match.empty:
    match = df[df[label_col] == cls_name]
  if match.empty:
    print(f"[warn] no samples for {cls_name}, skipping")
    continue
  row = match.iloc[0]
  samples.append({
    "true_label": cls_name,
    "description": DESCRIPTIONS.get(cls_name, ""),
    "features": [float(row[c]) for c in feature_cols]
  })

out_path = BASE / "models" / "har_demo_samples.json"
out_path.write_text(json.dumps({"samples": samples, "feature_count": len(feature_cols)}))
print(f"[ok] wrote {len(samples)} samples ({len(feature_cols)} features each) -> {out_path}")
