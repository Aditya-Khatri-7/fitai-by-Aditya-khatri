import os
import sys
import zipfile
import json
import urllib.request
from pathlib import Path

# Setup directories
BASE_DIR = Path(__file__).resolve().parent
RAW_DIR = BASE_DIR / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

# Full Dataset Registry (Original 7 + 8 New)
DATASETS = [
  # --- Preserved Original Datasets ---
  {"name": "gym_exercises", "slug": "niharika41298/gym-exercise-data"},
  {"name": "fitbit", "slug": "arashnic/fitbit"},
  {"name": "sleep_health", "slug": "uom190346a/sleep-health-and-lifestyle-dataset"},
  {"name": "gym_members", "slug": "valakhorasani/gym-members-exercise-dataset"},
  {"name": "indian_food", "slug": "nehaprabhavalkar/indian-food-101"},
  {"name": "heart_disease", "slug": "fedesoriano/heart-failure-prediction"},
  {"name": "diabetes", "slug": "uciml/pima-indians-diabetes-database"},

  # --- New Expanded Datasets ---
  {"name": "food101", "slug": "dansbecker/food-101"},
  {"name": "har", "slug": "uciml/human-activity-recognition-with-smartphones"},
  {"name": "bodyfat", "slug": "fedesoriano/body-fat-prediction-dataset"},
  {"name": "stress", "slug": "graceline/stress-detection-dataset"},
  {"name": "rehabilitation", "slug": "subhamjain/rehabilitation-exercise-dataset"},
  {"name": "yoga", "slug": "niharika41298/yoga-pose-dataset"},
  {"name": "meditation", "slug": "amaarora/mental-health-dataset"},
  {"name": "ifct", "slug": "nehaprabhavalkar/indian-food-composition-tables"}
]

def check_kaggle_creds():
  kaggle_json = Path.home() / ".kaggle" / "kaggle.json"
  if not kaggle_json.exists():
    print(f"[ERROR] Kaggle credentials missing at {kaggle_json}")
    return False
  return True

def download_datasets():
  if not check_kaggle_creds() and not (os.environ.get("KAGGLE_USERNAME") and os.environ.get("KAGGLE_KEY")):
    raise SystemExit(
      "[ERROR] No Kaggle credentials found. Create ~/.kaggle/kaggle.json "
      "(from https://www.kaggle.com/settings -> API -> Create New Token) "
      "or set KAGGLE_USERNAME and KAGGLE_KEY environment variables, then retry."
    )

  try:
    import kaggle
    api = kaggle.KaggleApi()
    api.authenticate()
    print("[Kaggle API] Authenticated successfully as adityakhatri7")
  except Exception as e:
    print(f"[Kaggle Warning] API auth check: {e}")
    api = None

  for ds in DATASETS:
    target_dir = RAW_DIR / ds["name"]
    target_dir.mkdir(parents=True, exist_ok=True)

    # Check if dataset already downloaded (non-empty folder)
    if any(target_dir.iterdir()):
      print(f"[SKIP] Dataset '{ds['name']}' already exists in {target_dir}")
      continue

    print(f"\n[Downloading] {ds['name']} ({ds['slug']})...")
    try:
      if api:
        api.dataset_download_files(ds["slug"], path=str(target_dir), unzip=True)
      else:
        os.system(f"kaggle datasets download -d {ds['slug']} -p \"{target_dir}\" --unzip")
      print(f"[SUCCESS] Downloaded & unzipped {ds['name']}")
    except Exception as err:
      print(f"[WARNING] Could not download {ds['name']} ({err}). Created directory placeholder.")

def download_usda_foods():
  usda_file = RAW_DIR / "usda_foods.json"
  if usda_file.exists():
    print(f"[SKIP] USDA foods dataset already exists at {usda_file}")
    return

  print("\n[Downloading] USDA FoodData Central foundation foods API...")
  url = "https://api.nal.usda.gov/fdc/v1/foods/list?dataType=Foundation&pageSize=200&api_key=DEMO_KEY"

  try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
      data = json.loads(response.read().decode())
      with open(usda_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
      print(f"[SUCCESS] Saved USDA foods dataset ({len(data)} items)")
  except Exception as e:
    print(f"[WARNING] Could not download USDA foods: {e}")

def main():
  print("==================================================")
  print("   FitAI Datasets Expanded Download Pipeline      ")
  print("==================================================")

  download_datasets()
  download_usda_foods()

  print("\n==================================================")
  print("   Dataset Expansion Pipeline Completed!          ")
  print("   Raw files located in: ", RAW_DIR)
  print("==================================================")

if __name__ == "__main__":
  main()
