# FitAI — Dataset & ML Pipeline Documentation

This document reflects the **actual, verified state** of dataset integration as of this writing (checked directly against `datasets/raw/` contents and the ML training pipeline in `ml/training/`). Earlier drafts of this file overstated integration for several datasets that were never downloaded — this version corrects that.

---

## Datasets Actually Used by the ML Training Pipeline

These three are downloaded, real (not synthetic), and directly consumed by `ml/training/preprocess.py`:

| Dataset | Rows | Source | Used For |
|:---|:---|:---|:---|
| **Gym Members Exercise Tracking** | 973 | Kaggle: `valakhorasani/gym-members-exercise-tracking` | Real feature distributions for the injury risk classifier (workout frequency, session duration, HR, age, experience, BMI) and part of the recovery regressor's inputs (resting/active HR, hydration, age, BMI) |
| **Sleep Health and Lifestyle** | 374 | Kaggle: `uom190346a/sleep-health-and-lifestyle-dataset` | Real sleep duration/quality/stress/steps distributions for the recovery regressor and injury classifier |
| **Mega Gym Dataset** | 2,918 (after dropping incomplete rows) | Kaggle: `niharika41298/gym-exercise-data` | The full real exercise catalog behind the SentenceTransformer recommender — every exercise name, body part, equipment, and level shown in the app comes from this file |

**Honest limitation, by design:** neither dataset has real ground-truth recovery or injury outcome labels — no dataset tracks "this person actually got injured" or "this was their true recovery score." The recovery score and injury risk labels are still expert-formula/rule-threshold derived, same as before this rewrite. What changed is that the *input feature distributions* (sleep duration, heart rate, workout frequency, etc.) now come from real recorded people instead of `np.random` calls. `soreness_level` (recovery model) and `previous_injuries_count` (injury model) have no real source in any available dataset and remain synthetic — this is called out directly in code comments in `preprocess.py`.

---

## Datasets Downloaded but Not Yet Wired Into Any Pipeline

These exist under `datasets/raw/` (real Kaggle downloads) but no current code reads them. The Mongoose model files that would eventually consume them (`BodyComposition`, `MLPrediction`, `FoodRecognitionCache`) exist but are not populated from these files.

| Dataset | Rows | Source | Intended Use (not yet built) |
|:---|:---|:---|:---|
| **Fitbit Fitabase Export** | ~29 files, multiple thousand rows | Kaggle: `arashnic/fitbit` | Richer real wearable-telemetry simulation (currently `wearableController.js` just stores whatever the client sends) |
| **Body Fat** | 252 | Kaggle: `fedesoriano/body-fat-prediction-dataset` | Body composition reference ranges |
| **Diabetes (Pima)** | 768 | Kaggle: `uciml/pima-indians-diabetes-database` | Low-glycemic meal engine rules |
| **Heart Disease** | 918 | Kaggle: `fedesoriano/heart-failure-prediction` | DASH/hypertension protocol reference ranges |
| **Human Activity Recognition** | ~10,299 | Kaggle: `uciml/human-activity-recognition-with-smartphones` | Wearable activity-type classification |
| **Food-101** | 101,000 images (zip, not extracted) | Kaggle: `dansbecker/food-101` | Meal photo recognition (would need a vision model, not built) |
| **Indian Food 101** | 255 | Kaggle: `nehaprabhavalkar/indian-food-101` | Regional Indian meal suggestions |
| **USDA Foundation Foods** | JSON, ~197KB | USDA public API | Micronutrient lookups beyond the current meal-generation macros |

## Datasets Never Downloaded (Directories Exist, Empty)

A previous draft of this document claimed these were "Imported" with specific row counts and MongoDB collections. Direct inspection confirms the raw directories exist but contain zero files. The corresponding Mongoose models (`MentalHealthMetric.js`, `RehabilitationExercise.js`, `YogaExercise.js`, `MeditationSession.js`) exist in `backend/src/models/` but have never been populated by any script — they are unused, dormant schemas.

| Dataset | Status |
|:---|:---|
| Stress Detection | Not downloaded |
| Rehabilitation | Not downloaded |
| Yoga Pose | Not downloaded |
| Meditation | Not downloaded |
| Indian IFCT | Not downloaded |

The `backend/knowledge/*.json` files referenced by an earlier draft of this document (`yoga_mobility_knowledge.json`, `post_surgery_rehab_knowledge.json`, `meditation_stress_knowledge.json`, `indian_ifct_knowledge.json`) do not exist in the repository — removed from this document since they described planned, not built, functionality.

---

## What The Live ML Service Actually Serves

`ml/inference_service.py` (FastAPI, port 8001) loads three real artifacts trained from the datasets above:

1. **Recovery Score Regressor** — XGBoost, trained on `recovery_train/val/test.csv` (real sleep/gym feature distributions + formula-derived label).
2. **Injury Risk Classifier** — XGBoost multi-class, trained on `injury_train/val/test.csv` (real gym_members feature distributions + rule-derived label, thresholds calibrated to the real data's own quantiles).
3. **Exercise Recommender** — `all-MiniLM-L6-v2` SentenceTransformer embeddings over all 2,918 real megaGymDataset exercises, served via genuine cosine similarity against a query built from the user's goal/target muscles/equipment/level (not keyword matching).

None of these three write back into MongoDB — the Node backend calls the FastAPI service directly for predictions/recommendations at request time.
