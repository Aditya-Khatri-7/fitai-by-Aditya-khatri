import express from 'express';
import { getRecoveryPrediction, getInjuryPrediction, getExerciseRecommendations, getMetrics, getBodyFatPrediction, getDiabetesRiskScreen, getCardioRiskScreen, getMeditationRecommendations, getRehabExerciseSuggestions, getYogaPosePrediction, getMealPhotoPrediction, getStressLevelPrediction, getActivitySamples, classifyActivitySampleController } from '../controllers/mlController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/recovery', getRecoveryPrediction);
router.post('/injury-risk', getInjuryPrediction);
router.post('/recommend', getExerciseRecommendations);
router.get('/metrics', getMetrics);
router.post('/bodyfat', getBodyFatPrediction);
router.post('/diabetes-risk', getDiabetesRiskScreen);
router.post('/cardio-risk', getCardioRiskScreen);
router.post('/recommend-meditation', getMeditationRecommendations);
router.post('/rehab-suggestions', getRehabExerciseSuggestions);
router.post('/yoga-pose', getYogaPosePrediction);
router.post('/meal-photo', getMealPhotoPrediction);
router.post('/stress-level', getStressLevelPrediction);
router.get('/activity/samples', getActivitySamples);
router.post('/activity/classify-sample', classifyActivitySampleController);

export default router;
