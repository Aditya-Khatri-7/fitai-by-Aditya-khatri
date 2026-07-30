import os
import json
import joblib
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
BODYFAT_CSV = RAW_DIR / "bodyfat" / "bodyfat.csv"
DIABETES_CSV = RAW_DIR / "diabetes" / "diabetes.csv"
HEART_CSV = RAW_DIR / "heart_disease" / "heart.csv"
HAR_TRAIN_CSV = RAW_DIR / "har" / "train.csv"
HAR_TEST_CSV = RAW_DIR / "har" / "test.csv"
KNEE_REHAB_CSV = RAW_DIR / "rehabilitation" / "Knee_Rehabilitation_Dataset.csv"
STRESS_CSV = RAW_DIR / "stress" / "Stress-Lysis.csv"
INDIAN_FOOD_CSV = RAW_DIR / "indian_food" / "indian_food.csv"
IFCT_CSV = RAW_DIR / "ifct" / "ifct2017_compositions.csv"
MEDITATION_CSV = RAW_DIR / "meditation" / "meditation.csv"
YOGA_DIR = RAW_DIR / "yoga" / "DATASET"
FOOD_IMAGES_DIR = RAW_DIR / "food101" / "Indian Food Images" / "Indian Food Images"

# 20 of the 80 available real dish-photo classes, chosen for visual
# distinctiveness and overlap with the meal recommender's dish catalog (same
# names as indian_food.csv/indian_meals_clean.csv, so a photo prediction can
# look up real IFCT-derived nutrition directly) — not all 80, since 50
# images/class is little enough data that spreading it over fewer, more
# visually-distinct classes gives a meaningfully more accurate CPU-trained model.
FOOD_IMAGE_CLASSES = [
  'biryani', 'butter_chicken', 'chicken_tikka_masala', 'chicken_tikka', 'palak_paneer',
  'paneer_butter_masala', 'dal_makhani', 'chana_masala', 'naan', 'chapati',
  'bhatura', 'poha', 'jalebi', 'gulab_jamun', 'rasgulla',
  'ras_malai', 'gajar_ka_halwa', 'lassi', 'aloo_gobi', 'dum_aloo'
]

# Bridges colloquial/Hindi ingredient vocabulary used in indian_food.csv to the
# specific botanical/scientific naming IFCT2017 uses (e.g. "besan" -> "bengal
# gram, dal") — a vocabulary fix, not fabricated nutrition data; every value
# behind these keys still resolves to a real measured IFCT row. Generic "oil"
# maps to a list because IFCT has no single "cooking oil" entry, only specific
# oils — averaging real entries instead of guessing one.
_IFCT_SYNONYMS = {
  'besan': ['bengal gram, dal'], 'gram flour': ['bengal gram, dal'], 'chickpea flour': ['bengal gram, dal'],
  'urad dal': ['black gram, dal'], 'urad': ['black gram, dal'], 'white urad dal': ['black gram, dal'],
  'moong': ['green gram, dal'], 'moong dal': ['green gram, dal'], 'mung bean': ['green gram, dal'],
  'maida': ['wheat flour, refined'], 'refined flour': ['wheat flour, refined'],
  'all purpose flour': ['wheat flour, refined'], 'plain flour': ['wheat flour, refined'], 'white flour': ['wheat flour, refined'],
  'atta': ['wheat flour, atta'], 'whole wheat flour': ['wheat flour, atta'], 'wheat flour': ['wheat flour, atta'],
  'curd': ['milk, whole, cow'], 'dahi': ['milk, whole, cow'], 'yogurt': ['milk, whole, cow'], 'yoghurt': ['milk, whole, cow'],
  'oil': ['groundnut oil', 'mustard oil', 'sunflower oil', 'coconut oil'],
  'vegetable oil': ['groundnut oil', 'mustard oil', 'sunflower oil', 'coconut oil'],
}
_NUTRITION_COLS = ['enerc', 'protcnt', 'fatce', 'cho', 'fibtg']

# Neutral, course-level calorie/macro defaults used ONLY when literally none of a
# dish's ingredients resolve to any real IFCT row (e.g. paneer, mutton, sugar,
# butter, cream have no IFCT2017 entry at all) — same order-of-magnitude approach
# the old hardcoded template already used, kept as a documented last resort
# rather than silently leaving a dish with zero nutrition data.
_COURSE_FALLBACK = {
  'dessert': {'enerc': 350, 'protcnt': 5, 'fatce': 12, 'cho': 55, 'fibtg': 2},
  'main course': {'enerc': 320, 'protcnt': 12, 'fatce': 14, 'cho': 35, 'fibtg': 5},
  'snack': {'enerc': 250, 'protcnt': 7, 'fatce': 10, 'cho': 32, 'fibtg': 3},
  'starter': {'enerc': 280, 'protcnt': 15, 'fatce': 15, 'cho': 20, 'fibtg': 2},
}


def _match_ifct_row(phrase, ifct_lookup, ifct_names):
  phrase = phrase.strip().lower()
  if not phrase:
    return []
  for syn_key, ifct_targets in _IFCT_SYNONYMS.items():
    if syn_key in phrase:
      return [ifct_lookup[t] for t in ifct_targets if t in ifct_lookup]
  # Direct substring match either direction (e.g. "chicken thighs" <-> "chicken, poultry, thigh, skinless")
  first_word = phrase.split(',')[0].split()[0] if phrase.split() else phrase
  candidates = [name for name in ifct_names if first_word in name or name.split(',')[0].strip() in phrase]
  if candidates:
    return [ifct_lookup[candidates[0]]]
  return []


def preprocess_indian_meals():
  print("[Preprocessing] Indian Meal Recommender Data (real indian_food.csv + ifct2017 nutrition)...")

  food_df = pd.read_csv(INDIAN_FOOD_CSV)
  ifct_df = pd.read_csv(IFCT_CSV)
  ifct_df['name_norm'] = ifct_df['name'].str.strip().str.lower()
  ifct_df = ifct_df.drop_duplicates(subset='name_norm', keep='first')
  ifct_lookup = ifct_df.set_index('name_norm')[_NUTRITION_COLS].to_dict('index')
  ifct_names = list(ifct_lookup.keys())

  records = []
  for _, row in food_df.iterrows():
    ingredients = [p.strip() for p in str(row['ingredients']).split(',') if p.strip()]
    matched_rows = []
    for phrase in ingredients:
      matched_rows.extend(_match_ifct_row(phrase, ifct_lookup, ifct_names))

    course = str(row['course']).strip().lower() if pd.notna(row['course']) else 'main course'
    fallback = _COURSE_FALLBACK.get(course, _COURSE_FALLBACK['main course'])

    if matched_rows:
      avg = {col: float(np.mean([m[col] for m in matched_rows])) for col in _NUTRITION_COLS}
      match_ratio = len(matched_rows) / max(len(ingredients), 1)
      nutrition_source = 'ifct_composition' if match_ratio >= 0.5 else 'ifct_partial'
    else:
      avg = fallback
      nutrition_source = 'estimated_fallback'

    region = row['region'] if pd.notna(row['region']) and row['region'] != '-1' else 'any'
    flavor = row['flavor_profile'] if pd.notna(row['flavor_profile']) and row['flavor_profile'] != '-1' else 'mild'
    ingredients_lower = str(row['ingredients']).lower()
    has_dairy = any(d in ingredients_lower for d in ['milk', 'ghee', 'curd', 'dahi', 'yogurt', 'paneer', 'cream', 'butter', 'cheese', 'khoa', 'malai'])
    is_vegan_friendly = (row['diet'] == 'vegetarian') and not has_dairy

    records.append({
      'name': row['name'],
      'ingredients': row['ingredients'],
      'diet': row['diet'],
      'is_vegan_friendly': is_vegan_friendly,
      'course': row['course'] if pd.notna(row['course']) else 'main course',
      'flavor_profile': flavor,
      'region': region,
      'prep_time': row['prep_time'] if pd.notna(row['prep_time']) and row['prep_time'] != -1 else None,
      'cook_time': row['cook_time'] if pd.notna(row['cook_time']) and row['cook_time'] != -1 else None,
      'calories_per_100g': round(avg['enerc'], 1),
      'protein_g': round(avg['protcnt'], 1),
      'fat_g': round(avg['fatce'], 1),
      'carbs_g': round(avg['cho'], 1),
      'fiber_g': round(avg['fibtg'], 1),
      'nutrition_source': nutrition_source
    })

  df = pd.DataFrame(records)
  df['text'] = df.apply(
    lambda r: f"{r['name']} ({r['diet']}) {r['course']} with {r['ingredients']}, {r['flavor_profile']} flavor, {r['region']} Indian cuisine",
    axis=1
  )
  df.to_csv(PROCESSED_DIR / "indian_meals_clean.csv", index=False)

  source_counts = df['nutrition_source'].value_counts().to_dict()
  print(f" [OK] Indian meals dataset ready: {len(df)} real dishes. Nutrition sources: {source_counts}")


def preprocess_meditation_data():
  print("[Preprocessing] Meditation Recommender Data (real meditation.csv, 68 techniques)...")

  df = pd.read_csv(MEDITATION_CSV)
  df = df.rename(columns={'Name': 'title', 'Description': 'description', 'Duration': 'duration', 'Instructions': 'instructions'})
  df['text'] = df.apply(lambda r: f"{r['title']}: {r['description']} Duration: {r['duration']}. {r['instructions']}", axis=1)
  df.to_csv(PROCESSED_DIR / "meditation_clean.csv", index=False)

  print(f" [OK] Meditation dataset ready: {len(df)} real techniques.")


FITBIT_DIR = RAW_DIR / "fitbit"


def _load_fitbit_joined_daily_data():
  # Real per-user, per-day joined rows (steps + heart rate + sleep, all from the
  # SAME person's SAME day) pulled from both real Fitabase export windows — used
  # to blend genuinely jointly-consistent data into the recovery training set
  # below, upgrading part of it from two independently-sampled sources (see
  # preprocess_recovery_data()) to real joined records. The two windows have
  # asymmetric sleep files: window 2 has a ready-made sleepDay_merged.csv, window
  # 1 only has minute-level minuteSleep_merged.csv and needs aggregating.
  window_dirs = [
    (FITBIT_DIR / "mturkfitbit_export_3.12.16-4.11.16" / "Fitabase Data 3.12.16-4.11.16", 'minute_sleep'),
    (FITBIT_DIR / "mturkfitbit_export_4.12.16-5.12.16" / "Fitabase Data 4.12.16-5.12.16", 'sleep_day'),
  ]

  def _hr_daily_agg(values):
    resting = max(40.0, float(np.percentile(values, 5)))
    threshold = np.percentile(values, 75)
    above = values[values > threshold]
    active = float(above.mean()) if len(above) else float(values.mean())
    return pd.Series({'resting_hr': resting, 'active_hr': active})

  joined_frames = []
  for window_dir, sleep_format in window_dirs:
    daily = pd.read_csv(window_dir / "dailyActivity_merged.csv")
    daily['date'] = pd.to_datetime(daily['ActivityDate'], format='%m/%d/%Y').dt.date
    daily = daily[['Id', 'date', 'TotalSteps']].rename(columns={'TotalSteps': 'steps'})

    hr = pd.read_csv(window_dir / "heartrate_seconds_merged.csv")
    hr['date'] = pd.to_datetime(hr['Time'], format='%m/%d/%Y %I:%M:%S %p').dt.date
    hr_daily = hr.groupby(['Id', 'date'])['Value'].apply(_hr_daily_agg).unstack().reset_index()

    if sleep_format == 'sleep_day':
      sleep = pd.read_csv(window_dir / "sleepDay_merged.csv")
      sleep['date'] = pd.to_datetime(sleep['SleepDay'], format='%m/%d/%Y %I:%M:%S %p').dt.date
      sleep['sleep_duration'] = sleep['TotalMinutesAsleep'] / 60.0
      sleep = sleep[['Id', 'date', 'sleep_duration']]
    else:
      minute_sleep = pd.read_csv(window_dir / "minuteSleep_merged.csv")
      minute_sleep['date'] = pd.to_datetime(minute_sleep['date'], format='%m/%d/%Y %I:%M:%S %p').dt.date
      asleep_minutes = minute_sleep[minute_sleep['value'] == 1].groupby(['Id', 'date']).size()
      sleep = asleep_minutes.reset_index(name='asleep_minutes')
      sleep['sleep_duration'] = sleep['asleep_minutes'] / 60.0
      sleep = sleep[['Id', 'date', 'sleep_duration']]

    joined = daily.merge(hr_daily, on=['Id', 'date'], how='inner').merge(sleep, on=['Id', 'date'], how='inner')
    joined_frames.append(joined)

  joined = pd.concat(joined_frames, ignore_index=True)
  # Sanity-filter physically implausible joined rows (sensor dropout artifacts)
  # rather than letting them corrupt the blended training distribution.
  joined = joined[(joined['steps'] > 0) & (joined['sleep_duration'] > 1) & (joined['sleep_duration'] < 14)]
  return joined[['steps', 'resting_hr', 'active_hr', 'sleep_duration']].reset_index(drop=True)


def preprocess_recovery_data():
  print("[Preprocessing] Recovery Score Data (blend of real Fitbit joined rows + sleep_health/gym_members)...")

  np.random.seed(42)
  n_samples = 3500

  sleep_df = pd.read_csv(SLEEP_CSV)
  gym_df = pd.read_csv(GYM_MEMBERS_CSV)
  fitbit_joined = _load_fitbit_joined_daily_data()

  # Sample real per-feature distributions (with replacement — source datasets are
  # smaller than n_samples) from the two most relevant real Kaggle datasets. The two
  # feature groups come from different real people, so they're independently sampled,
  # not row-joined — see PR4 plan notes on why no cross-dataset join is attempted.
  sleep_sample = sleep_df.sample(n=n_samples, replace=True, random_state=1).reset_index(drop=True)
  gym_sample = gym_df.sample(n=n_samples, replace=True, random_state=2).reset_index(drop=True)

  # ~45% of rows for steps/resting_hr/active_hr/sleep_duration now come from real
  # SAME-person SAME-day Fitbit joined rows instead of the independent sampling
  # above — a genuine data-quality upgrade for those 4 fields. stress_level/
  # hydration/soreness/age/bmi have no Fitbit equivalent, so they still come from
  # the sleep_health/gym_members independent sampling for every row.
  n_fitbit = int(n_samples * 0.45)
  n_independent = n_samples - n_fitbit
  fitbit_sample = fitbit_joined.sample(n=n_fitbit, replace=True, random_state=5).reset_index(drop=True)

  sleep_duration = np.concatenate([
    fitbit_sample['sleep_duration'].to_numpy(),
    sleep_sample['Sleep Duration'].to_numpy()[:n_independent]
  ])
  steps = np.concatenate([
    fitbit_sample['steps'].to_numpy().astype(float),
    sleep_sample['Daily Steps'].to_numpy()[:n_independent].astype(float)
  ])
  resting_hr = np.concatenate([
    fitbit_sample['resting_hr'].to_numpy(),
    gym_sample['Resting_BPM'].to_numpy()[:n_independent].astype(float)
  ])
  active_hr = np.concatenate([
    fitbit_sample['active_hr'].to_numpy(),
    gym_sample['Avg_BPM'].to_numpy()[:n_independent].astype(float)
  ])
  data_source = np.array(['real_fitbit_joined'] * n_fitbit + ['independent_sample'] * n_independent)

  sleep_quality = sleep_sample['Quality of Sleep'].to_numpy() * 10.0  # 1-10 -> 0-100 scale
  stress_level = sleep_sample['Stress Level'].to_numpy() * 10.0       # 1-10 -> 0-100 scale

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
    'recovery_score': recovery_score,
    'data_source': data_source
  })

  # Real-Fitbit and independently-sampled rows are concatenated in blocks above,
  # so this shuffle is required — without it, the positional train/val/test slice
  # below would put all real Fitbit rows in train and none in val/test.
  df = df.sample(frac=1, random_state=6).reset_index(drop=True)

  train = df.iloc[:2800]
  val = df.iloc[2800:3150]
  test = df.iloc[3150:]

  train.to_csv(PROCESSED_DIR / "recovery_train.csv", index=False)
  val.to_csv(PROCESSED_DIR / "recovery_val.csv", index=False)
  test.to_csv(PROCESSED_DIR / "recovery_test.csv", index=False)

  fitbit_pct = (df['data_source'] == 'real_fitbit_joined').mean() * 100
  print(f" [OK] Recovery dataset generated: {len(df)} rows, {fitbit_pct:.0f}% from real same-person-same-day Fitbit joins ({len(fitbit_joined)} unique real joined days available).")


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


def preprocess_bodyfat_data():
  print("[Preprocessing] Body Fat % Estimator Data (real bodyfat.csv, Behnke/Siri Navy dataset)...")

  df = pd.read_csv(BODYFAT_CSV)

  # Two documented data-entry errors in this well-known dataset: one row has
  # Height=29.5in (physically impossible, a known typo — should read ~69.5in) and
  # one row has BodyFat=0.0% (physiologically implausible). Drop both rather than guess.
  df = df[df['Height'] > 55].reset_index(drop=True)
  df = df[df['BodyFat'] > 1].reset_index(drop=True)

  # Imperial -> metric: the app (User.profile) stores height/weight in cm/kg. The
  # dataset's circumference columns are already in cm.
  df['weight_kg'] = df['Weight'] * 0.453592
  df['height_cm'] = df['Height'] * 2.54
  df['bmi'] = df['weight_kg'] / (df['height_cm'] / 100.0) ** 2

  df = df.rename(columns={'Age': 'age', 'Neck': 'neck_cm', 'Abdomen': 'abdomen_cm', 'BodyFat': 'bodyfat_pct'})

  # Trained ONLY on the features the app can actually supply at inference time
  # (age/weight/height/bmi always known; neck/abdomen circumference is the smallest
  # optional 2-field form worth asking for, per the Navy method's most predictive
  # measurements) — deliberately dropping Chest/Hip/Thigh/Knee/Ankle/Biceps/Forearm/
  # Wrist entirely rather than training on them and faking defaults at inference,
  # which would create a permanent train/inference distribution mismatch.
  features = ['age', 'weight_kg', 'height_cm', 'bmi', 'neck_cm', 'abdomen_cm']
  df = df[features + ['bodyfat_pct']]

  df = df.sample(frac=1, random_state=7).reset_index(drop=True)
  n = len(df)
  n_train, n_val = int(n * 0.7), int(n * 0.85)

  df.iloc[:n_train].to_csv(PROCESSED_DIR / "bodyfat_train.csv", index=False)
  df.iloc[n_train:n_val].to_csv(PROCESSED_DIR / "bodyfat_val.csv", index=False)
  df.iloc[n_val:].to_csv(PROCESSED_DIR / "bodyfat_test.csv", index=False)

  print(f" [OK] Body fat dataset ready (real Navy dataset, metric-converted): {len(df)} rows.")


def preprocess_diabetes_data():
  print("[Preprocessing] Diabetes Risk Screener Data (real Pima Indians Diabetes dataset)...")

  df = pd.read_csv(DIABETES_CSV)

  # Documented dataset quirk: 0 in Glucose/BloodPressure/BMI is recorded-as-missing,
  # not a real physiological zero. Median-impute (excluding the zeros themselves).
  for col in ['Glucose', 'BloodPressure', 'BMI']:
    median_val = df.loc[df[col] != 0, col].median()
    df[col] = df[col].replace(0, median_val)

  # SkinThickness/Insulin are dropped entirely: over 30%/45% of this dataset's own
  # rows are missing them (also 0-as-missing), and the app has no path to ever
  # collect either one — training on features that will always be absent at
  # inference just adds noise, not signal.
  df = df.rename(columns={
    'Pregnancies': 'pregnancies', 'Glucose': 'glucose', 'BloodPressure': 'blood_pressure',
    'BMI': 'bmi', 'DiabetesPedigreeFunction': 'pedigree', 'Age': 'age', 'Outcome': 'diabetes_risk'
  })
  features = ['pregnancies', 'glucose', 'blood_pressure', 'bmi', 'pedigree', 'age']
  df = df[features + ['diabetes_risk']]

  df = df.sample(frac=1, random_state=11).reset_index(drop=True)
  n = len(df)
  n_train, n_val = int(n * 0.7), int(n * 0.85)

  df.iloc[:n_train].to_csv(PROCESSED_DIR / "diabetes_train.csv", index=False)
  df.iloc[n_train:n_val].to_csv(PROCESSED_DIR / "diabetes_val.csv", index=False)
  df.iloc[n_val:].to_csv(PROCESSED_DIR / "diabetes_test.csv", index=False)

  print(f" [OK] Diabetes screening dataset ready (real Pima Indians data, 0-as-missing imputed): {len(df)} rows.")


def preprocess_heart_data():
  print("[Preprocessing] Cardiovascular Risk Screener Data (real heart.csv, fedesoriano merged dataset)...")

  df = pd.read_csv(HEART_CSV)

  # Documented artifact in this specific file: Cholesterol=0 is missing data, not a
  # real reading. Median-impute excluding the zeros.
  median_chol = df.loc[df['Cholesterol'] != 0, 'Cholesterol'].median()
  df['Cholesterol'] = df['Cholesterol'].replace(0, median_chol)

  # Collapse the dataset's 4-way chest pain type down to the 2-way distinction the
  # app can realistically ask a user for in a one-tap optional field.
  df['chest_pain_symptomatic'] = (df['ChestPainType'] != 'ASY').astype(int)
  df['sex_male'] = (df['Sex'] == 'M').astype(int)
  df['exercise_angina'] = (df['ExerciseAngina'] == 'Y').astype(int)

  df = df.rename(columns={
    'Age': 'age', 'RestingBP': 'resting_bp', 'MaxHR': 'max_hr', 'HeartDisease': 'cardio_risk'
  })

  # FastingBS/RestingECG/Oldpeak/ST_Slope dropped entirely for the same reason as
  # SkinThickness/Insulin above: the app has no path to ever collect them, so
  # training on them would only teach the model to rely on features that will
  # always be missing in production. Cholesterol IS kept even though it's not yet
  # collected, because the health-screening form (Phase 3) explicitly asks for it.
  df = df.rename(columns={'Cholesterol': 'cholesterol'})
  features = ['age', 'sex_male', 'resting_bp', 'max_hr', 'chest_pain_symptomatic', 'exercise_angina', 'cholesterol']
  df = df[features + ['cardio_risk']]

  df = df.sample(frac=1, random_state=13).reset_index(drop=True)
  n = len(df)
  n_train, n_val = int(n * 0.7), int(n * 0.85)

  df.iloc[:n_train].to_csv(PROCESSED_DIR / "heart_train.csv", index=False)
  df.iloc[n_train:n_val].to_csv(PROCESSED_DIR / "heart_val.csv", index=False)
  df.iloc[n_val:].to_csv(PROCESSED_DIR / "heart_test.csv", index=False)

  print(f" [OK] Cardio risk dataset ready (real heart.csv, Cholesterol imputed): {len(df)} rows.")


def preprocess_har_data():
  print("[Preprocessing] Activity Recognition Data (real UCI HAR smartphone sensor dataset)...")

  train_full = pd.read_csv(HAR_TRAIN_CSV)
  test_full = pd.read_csv(HAR_TEST_CSV)

  feature_cols = [c for c in train_full.columns if c not in ('subject', 'Activity')]
  classes = sorted(train_full['Activity'].unique())
  label_map = {c: i for i, c in enumerate(classes)}

  # Respect the dataset's own train/test split (test.csv holds out entirely
  # different subjects from train.csv) rather than reshuffling across it — carve
  # val out of TRAIN only, by subject, so no subject appears in both train and val.
  train_subjects = sorted(train_full['subject'].unique())
  val_subjects = set(train_subjects[::5])  # every 5th subject -> ~20% held out for val
  val_mask = train_full['subject'].isin(val_subjects)

  def to_processed(df):
    out = df[feature_cols].copy()
    out['activity'] = df['Activity'].map(label_map)
    return out

  to_processed(train_full[~val_mask]).to_csv(PROCESSED_DIR / "har_train.csv", index=False)
  to_processed(train_full[val_mask]).to_csv(PROCESSED_DIR / "har_val.csv", index=False)
  to_processed(test_full).to_csv(PROCESSED_DIR / "har_test.csv", index=False)
  joblib.dump({"classes": classes, "feature_cols": feature_cols}, PROCESSED_DIR / "har_label_map.pkl")

  print(f" [OK] HAR dataset ready (real UCI smartphone sensor data): {len(train_full)} train + {len(test_full)} held-out test rows, {len(classes)} activity classes.")


def preprocess_knee_rehab_data():
  print("[Preprocessing] Rehab Recovery Status Data (real knee rehabilitation sensor/IMU dataset)...")

  df = pd.read_csv(KNEE_REHAB_CSV)
  df = df.rename(columns={'Gender': 'gender'})
  df['gender_male'] = (df['gender'] == 'Male').astype(int)

  status_classes = sorted(df['Rehabilitation_Status'].unique())
  status_map = {c: i for i, c in enumerate(status_classes)}
  df['rehab_status'] = df['Rehabilitation_Status'].map(status_map)

  features = [
    'Age', 'gender_male', 'BMI', 'Injury_Duration_days', 'Pain_Score', 'Rehabilitation_Session',
    'Knee_Flexion_Angle', 'Knee_Extension_Angle', 'Joint_Load_N', 'Step_Length_m', 'Stride_Time_s',
    'Gait_Speed_mps', 'Balance_Index', 'Muscle_Activation_pct', 'Heart_Rate_bpm', 'Fatigue_Level',
    'Sleep_Quality', 'Exercise_Compliance_pct'
  ]
  df = df[features + ['rehab_status']]

  df = df.sample(frac=1, random_state=17).reset_index(drop=True)
  n = len(df)
  n_train, n_val = int(n * 0.7), int(n * 0.85)

  df.iloc[:n_train].to_csv(PROCESSED_DIR / "knee_rehab_train.csv", index=False)
  df.iloc[n_train:n_val].to_csv(PROCESSED_DIR / "knee_rehab_val.csv", index=False)
  df.iloc[n_val:].to_csv(PROCESSED_DIR / "knee_rehab_test.csv", index=False)
  joblib.dump({"classes": status_classes}, PROCESSED_DIR / "knee_rehab_label_map.pkl")

  print(f" [OK] Knee rehab dataset ready (real IMU/gait sensor data): {len(df)} rows, classes={status_classes}.")


def preprocess_stress_data():
  print("[Preprocessing] Stress Level Data (real Stress-Lysis wearable humidity/temperature dataset)...")

  df = pd.read_csv(STRESS_CSV)
  df = df.rename(columns={'Humidity': 'skin_humidity', 'Temperature': 'skin_temperature', 'Step count': 'steps', 'Stress Level': 'stress_level'})

  df = df.sample(frac=1, random_state=19).reset_index(drop=True)
  n = len(df)
  n_train, n_val = int(n * 0.7), int(n * 0.85)

  df.iloc[:n_train].to_csv(PROCESSED_DIR / "stress_train.csv", index=False)
  df.iloc[n_train:n_val].to_csv(PROCESSED_DIR / "stress_val.csv", index=False)
  df.iloc[n_val:].to_csv(PROCESSED_DIR / "stress_test.csv", index=False)

  print(f" [OK] Stress dataset ready (real wearable skin-sensor data, published Stress-Lysis study): {len(df)} rows.")


def preprocess_yoga_manifest():
  print("[Preprocessing] Yoga Pose Image Manifest (real yoga pose photos, 5 classes)...")

  classes = sorted([d.name for d in (YOGA_DIR / "TRAIN").iterdir() if d.is_dir()])

  def scan(split):
    rows = []
    for c in classes:
      for f in (YOGA_DIR / split / c).glob("*"):
        if f.is_file():
          rows.append({'filepath': str(f), 'label': c})
    return pd.DataFrame(rows)

  train_all = scan("TRAIN").sample(frac=1, random_state=21).reset_index(drop=True)
  test_df = scan("TEST")

  n_val = int(len(train_all) * 0.15)
  val_df = train_all.iloc[:n_val]
  train_df = train_all.iloc[n_val:]

  train_df.to_csv(PROCESSED_DIR / "yoga_train_manifest.csv", index=False)
  val_df.to_csv(PROCESSED_DIR / "yoga_val_manifest.csv", index=False)
  test_df.to_csv(PROCESSED_DIR / "yoga_test_manifest.csv", index=False)
  joblib.dump(classes, PROCESSED_DIR / "yoga_classes.pkl")

  print(f" [OK] Yoga manifest ready: {len(train_df)} train / {len(val_df)} val / {len(test_df)} test images, classes={classes}")


def preprocess_food_manifest():
  print("[Preprocessing] Indian Food Photo Manifest (real dish photos, 20-class subset)...")

  rows = []
  for c in FOOD_IMAGE_CLASSES:
    class_dir = FOOD_IMAGES_DIR / c
    for f in sorted(class_dir.glob("*")):
      if f.is_file():
        rows.append({'filepath': str(f), 'label': c})

  df = pd.DataFrame(rows).sample(frac=1, random_state=23).reset_index(drop=True)

  # Stratified-ish split by taking a fixed count per class in shuffled order
  # rather than a single global cut, so every class is represented in val/test.
  train_rows, val_rows, test_rows = [], [], []
  for c in FOOD_IMAGE_CLASSES:
    class_rows = df[df['label'] == c]
    n = len(class_rows)
    n_val = max(1, int(n * 0.1))
    n_test = max(1, int(n * 0.1))
    test_rows.append(class_rows.iloc[:n_test])
    val_rows.append(class_rows.iloc[n_test:n_test + n_val])
    train_rows.append(class_rows.iloc[n_test + n_val:])

  train_df = pd.concat(train_rows).sample(frac=1, random_state=24).reset_index(drop=True)
  val_df = pd.concat(val_rows).reset_index(drop=True)
  test_df = pd.concat(test_rows).reset_index(drop=True)

  train_df.to_csv(PROCESSED_DIR / "food_train_manifest.csv", index=False)
  val_df.to_csv(PROCESSED_DIR / "food_val_manifest.csv", index=False)
  test_df.to_csv(PROCESSED_DIR / "food_test_manifest.csv", index=False)
  joblib.dump(FOOD_IMAGE_CLASSES, PROCESSED_DIR / "food_classes.pkl")

  print(f" [OK] Food photo manifest ready: {len(train_df)} train / {len(val_df)} val / {len(test_df)} test images, {len(FOOD_IMAGE_CLASSES)} classes")


def main():
  print("==================================================")
  print("      FitAI ML Data Preprocessing Pipeline        ")
  print("==================================================")
  preprocess_recovery_data()
  preprocess_injury_data()
  preprocess_exercises()
  preprocess_bodyfat_data()
  preprocess_diabetes_data()
  preprocess_heart_data()
  preprocess_har_data()
  preprocess_knee_rehab_data()
  preprocess_stress_data()
  preprocess_indian_meals()
  preprocess_meditation_data()
  preprocess_yoga_manifest()
  preprocess_food_manifest()
  print("==================================================")
  print("      Preprocessing Finished Successfully!        ")
  print("==================================================")


if __name__ == "__main__":
  main()
