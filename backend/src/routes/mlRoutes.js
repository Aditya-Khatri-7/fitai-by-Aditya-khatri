import express from 'express';
import { getRecoveryPrediction, getInjuryPrediction, getExerciseRecommendations, getMetrics } from '../controllers/mlController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/recovery', getRecoveryPrediction);
router.post('/injury-risk', getInjuryPrediction);
router.post('/recommend', getExerciseRecommendations);
router.get('/metrics', getMetrics);

export default router;
