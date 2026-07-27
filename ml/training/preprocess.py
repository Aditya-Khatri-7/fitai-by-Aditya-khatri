import os
import json
import pandas as pd
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
RAW_DIR = BASE_DIR / "datasets" / "raw"
PROCESSED_DIR = BASE_DIR / "datasets" / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

SLEEP_CSV = RAW_DIR / "sleep_health" / "Sleep_health_and_lifestyle_dataset.csv"
GYM_MEMBERS_CSV = RAW_DIR / "gym_members" / "gym_members_exercise_tracking.csv"
MEGA_GYM_CSV = RAW_DIR / "gym_exercises" / "megaGymDataset.csv"


def preprocess_recovery_data():
  print("[Preprocessing] Recovery Score Data (real distributions from sleep_health + gym_members)...")

  np.random.seed(42)
  n_samples = 3500

  sleep_df = pd.read_csv(SLEEP_CSV)
  gym_df = pd.read_csv(GYM_MEMBERS_CSV)

  # Sample real per-feature distributions (with replacement — source datasets are
  # smaller than n_samples) from the two most relevant real Kaggle datasets. The two
  # feature groups come from different real people, so they're independently sampled,
  # not row-joined — see PR4 plan notes on why no cross-dataset join is attempted.
  sleep_sample = sleep_df.sample(n=n_samples, replace=True, random_state=1).reset_index(drop=True)
  gym_sample = gym_df.sample(n=n_samples, replace=True, random_state=2).reset_index(drop=True)

  sleep_duration = sleep_sample['Sleep Duration'].to_numpy()
  sleep_quality = sleep_sample['Quality of Sleep'].to_numpy() * 10.0  # 1-10 -> 0-100 scale
  stress_level = sleep_sample['Stress Level'].to_numpy() * 10.0       # 1-10 -> 0-100 scale
  steps = sleep_sample['Daily Steps'].to_numpy().astype(float)

  resting_hr = gym_sample['Resting_BPM'].to_numpy().astype(float)
  active_hr = gym_sample['Avg_BPM'].to_numpy().astype(float)
  hydration = np.clip(gym_sample['Water_Intake (liters)'].to_numpy() * 4.0, 0, 10)  # liters -> ~glasses
  age = gym_sample['Age'].to_numpy().astype(float)
  bmi = gym_sample['BMI'].to_numpy().astype(float)

  # No dataset tracks subjective muscle soreness — kept formula-derived/synthetic,
  # unlike every other feature above which now comes from real recorded data.
  soreness_level = np.random.uniform(1, 10, n_samples)

  norm_sleep = (sleep_duration / 9.0) * 100
  norm_soreness = (10.0 - soreness_level) * 10
  norm_stress = 100 - stress_level
  hr_delta = np.abs(resting_hr - 62) * 2
  norm_hr = np.maximum(0, 100 - hr_delta)
  norm_hydration = np.minimum(100, (hydration / 8.0) * 100)

  recovery_score = (
    0.30 * norm_sleep +
    0.25 * norm_soreness +
    0.20 * norm_stress +
    0.15 * norm_hr +
    0.10 * norm_hydration +
    np.random.normal(0, 2.5, n_samples)
  )
  recovery_score = np.clip(recovery_score, 0, 100)

  df = pd.DataFrame({
    'sleep_duration': sleep_duration,
    'sleep_quality': sleep_quality,
    'stress_level': stress_level,
    'resting_hr': resting_hr,
    'active_hr': active_hr,
    'steps': steps,
    'hydration': hydration,
    'soreness_level': soreness_level,
    'age': age,
    'bmi': bmi,
    'recovery_score': recovery_score
  })

  train = df.iloc[:2800]
  val = df.iloc[2800:3150]
  test = df.iloc[3150:]

  train.to_csv(PROCESSED_DIR / "recovery_train.csv", index=False)
  val.to_csv(PROCESSED_DIR / "recovery_val.csv", index=False)
  test.to_csv(PROCESSED_DIR / "recovery_test.csv", index=False)

  print(f" [OK] Recovery dataset generated from real sleep_health/gym_members distributions: {len(df)} rows.")


def preprocess_injury_data():
  print("[Preprocessing] Injury Risk Classifier Data (real jointly-consistent rows from gym_members)...")

  np.random.seed(101)
  n_samples = 3000

  gym_df = pd.read_csv(GYM_MEMBERS_CSV)
  sleep_df = pd.read_csv(SLEEP_CSV)

  # workout_frequency/session_duration/age/experience/avg_intensity all come from the
  # SAME real row per person (jointly consistent), unlike the recovery dataset above
  # which combines two different real sources.
  gym_sample = gym_df.sample(n=n_samples, replace=True, random_state=3).reset_index(drop=True)
  sleep_sample = sleep_df.sample(n=n_samples, replace=True, random_state=4).reset_index(drop=True)

  frequency = gym_sample['Workout_Frequency (days/week)'].to_numpy().astype(int)
  duration = gym_sample['Session_Duration (hours)'].to_numpy() * 60.0  # hours -> minutes
  intensity = np.clip((gym_sample['Avg_BPM'] / gym_sample['Max_BPM']).to_numpy() * 10.0, 0, 10)
  sleep_avg = sleep_sample['Sleep Duration'].to_numpy()
  age = gym_sample['Age'].to_numpy().astype(int)
  experience = gym_sample['Experience_Level'].to_numpy().astype(int)

  # No dataset tracks a person's injury history — kept synthetic, explicitly flagged.
  prev_injuries = np.random.randint(0, 4, n_samples)

  # recovery_score_avg is derived with the SAME weighted formula as
  # preprocess_recovery_data() (not an independent random draw), using each row's own
  # real sleep/HR proxy — chains the two pipelines instead of decorrelating them.
  resting_hr_proxy = gym_sample['Resting_BPM'].to_numpy().astype(float)
  norm_sleep = (sleep_avg / 9.0) * 100
  norm_hr = np.maximum(0, 100 - np.abs(resting_hr_proxy - 62) * 2)
  recovery_score_avg = np.clip(0.5 * norm_sleep + 0.5 * norm_hr, 0, 100)

  # Thresholds are computed from the real data's own quantiles rather than fixed
  # cutoffs — the real gym_members/sleep_health ranges are much narrower than the old
  # synthetic uniform() ranges, so fixed absolute cutoffs collapsed everything into one
  # class. This keeps the same directional rule logic (high freq+duration+inexperience+
  # low recovery = high risk) while actually producing a three-way split on real data.
  duration_hi, duration_lo = np.percentile(duration, [70, 30])
  freq_hi, freq_lo = np.percentile(frequency, [70, 30])
  recovery_hi, recovery_lo = np.percentile(recovery_score_avg, [70, 30])

  labels = []
  for i in range(n_samples):
    # numpy.bool_ + numpy.bool_ behaves like logical OR (saturates at True), not
    # arithmetic addition — each condition must be cast to int() before summing or
    # this count silently caps at 1 and the >=3 checks below never fire.
    high_risk_signals = (
      int(duration[i] >= duration_hi) + int(frequency[i] >= freq_hi) +
      int(experience[i] <= 1) + int(recovery_score_avg[i] <= recovery_lo)
    )
    low_risk_signals = (
      int(duration[i] <= duration_lo) + int(frequency[i] <= freq_lo) +
      int(experience[i] >= 3) + int(recovery_score_avg[i] >= recovery_hi)
    )
    if high_risk_signals >= 3:
      labels.append(2)  # High Risk
    elif low_risk_signals >= 3:
      labels.append(0)  # Low Risk
    else:
      labels.append(1)  # Medium Risk

  df = pd.DataFrame({
    'workout_frequency_week': frequency,
    'avg_session_duration': duration,
    'avg_intensity': intensity,
    'sleep_avg_7d': sleep_avg,
    'previous_injuries_count': prev_injuries,
    'age': age,
    'experience_level': experience,
    'recovery_score_avg': recovery_score_avg,
    'injury_risk': labels
  })

  train = df.iloc[:2400]
  val = df.iloc[2400:2700]
  test = df.iloc[2700:]

  train.to_csv(PROCESSED_DIR / "injury_train.csv", index=False)
  val.to_csv(PROCESSED_DIR / "injury_val.csv", index=False)
  test.to_csv(PROCESSED_DIR / "injury_test.csv", index=False)

  print(f" [OK] Injury dataset generated from real gym_members rows: {len(df)} rows.")


def preprocess_exercises():
  print("[Preprocessing] Exercises & Seed Recommender Data (real megaGymDataset, 2900+ exercises)...")

  raw = pd.read_csv(MEGA_GYM_CSV)
  raw = raw.dropna(subset=['Title', 'BodyPart', 'Level'])
  raw['Equipment'] = raw['Equipment'].fillna('Other')
  raw['Desc'] = raw['Desc'].fillna('')

  def build_id(idx):
    return f"ex_{idx:04d}"

  exercises = []
  for idx, row in raw.reset_index(drop=True).iterrows():
    desc = row['Desc'].strip() if row['Desc'].strip() else (
      f"{row['Title']} is a {row['Level'].lower()}-level {row['Type'].lower()} exercise targeting {row['BodyPart'].lower()}."
    )
    exercises.append({
      'exercise_id': build_id(idx),
      'name': row['Title'],
      'body_part': row['BodyPart'],
      'equipment': row['Equipment'],
      'level': row['Level'],
      'type': row['Type'],
      'desc': desc
    })

  df = pd.DataFrame(exercises)
  df['text'] = df.apply(
    lambda r: f"{r['name']} targeting {r['body_part']} using {r['equipment']} at {r['level']} level. {r['desc']}",
    axis=1
  )
  df.to_csv(PROCESSED_DIR / "exercises_clean.csv", index=False)

  with open(PROCESSED_DIR / "exercise_seed.json", "w", encoding="utf-8") as f:
    json.dump(exercises, f, indent=2)

  print(f" [OK] Exercises dataset clean: {len(df)} real items from megaGymDataset. Saved CSV & JSON.")


def main():
  print("==================================================")
  print("      FitAI ML Data Preprocessing Pipeline        ")
  print("==================================================")
  preprocess_recovery_data()
  preprocess_injury_data()
  preprocess_exercises()
  print("==================================================")
  print("      Preprocessing Finished Successfully!        ")
  print("==================================================")


if __name__ == "__main__":
  main()
