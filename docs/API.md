# FitAI — API Reference

## Backend API Endpoints (Port 3000)
- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login user & return JWT
- `POST /api/workouts/generate` — Generate AI workout
- `POST /api/health/update` — Health status update wizard submission
- `POST /api/ml/recovery` — Proxy to Python ML recovery regressor
- `POST /api/ml/injury-risk` — Proxy to Python ML injury classifier
- `POST /api/ml/recommend` — Proxy to Python ML exercise recommender

## Python FastAPI Inference Endpoints (Port 8001)
- `GET /health` — Service & model load health check
- `POST /predict/recovery` — XGBoost recovery prediction
- `POST /predict/injury` — XGBoost injury risk prediction
- `POST /recommend/exercises` — Sentence-transformer vector similarity search
