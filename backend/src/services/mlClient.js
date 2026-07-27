import axios from 'axios';
import { fallbackRecoveryScore, fallbackInjuryRisk } from '../utils/fallbacks.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

const mlApi = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 5000
});

let failureCount = 0;
let circuitOpenUntil = 0;

export async function predictRecovery(biometrics) {
  if (Date.now() < circuitOpenUntil) {
    console.log('[ML Circuit Breaker] Using fallback recovery calculation');
    return fallbackRecoveryScore(biometrics);
  }

  try {
    const response = await mlApi.post('/predict/recovery', biometrics);
    failureCount = 0;
    return response.data;
  } catch (error) {
    failureCount++;
    if (failureCount >= 3) {
      circuitOpenUntil = Date.now() + 60000; // Skip ML for 60s
      console.warn('[ML Circuit Breaker] 3 consecutive failures. Circuit opened for 60s.');
    }
    console.warn(`[mlClient Warning] Recovery ML call failed (${error.message}). Returning rule fallback.`);
    return fallbackRecoveryScore(biometrics);
  }
}

export async function predictInjury(userContext) {
  if (Date.now() < circuitOpenUntil) {
    return fallbackInjuryRisk(userContext);
  }

  try {
    const response = await mlApi.post('/predict/injury', userContext);
    failureCount = 0;
    return response.data;
  } catch (error) {
    failureCount++;
    console.warn(`[mlClient Warning] Injury ML call failed (${error.message}). Returning rule fallback.`);
    return fallbackInjuryRisk(userContext);
  }
}

export async function getMLMetrics() {
  try {
    const response = await mlApi.get('/metrics');
    return response.data;
  } catch (error) {
    console.warn(`[mlClient Warning] Metrics fetch failed (${error.message}).`);
    return null;
  }
}

export async function recommendExercises(query) {
  try {
    const response = await mlApi.post('/recommend/exercises', query);
    return response.data.recommendations || [];
  } catch (error) {
    console.warn(`[mlClient Warning] Exercise Recommender ML call failed (${error.message}). Returning baseline candidates.`);
    return [
      { exercise_id: 'ex_01', name: 'Barbell Bench Press', body_part: 'Chest', equipment: 'Barbell', level: 'Intermediate', similarity_score: 0.88, reason: 'Baseline chest compound' },
      { exercise_id: 'ex_05', name: 'Machine Leg Press', body_part: 'Quads', equipment: 'Machine', level: 'Beginner', similarity_score: 0.85, reason: 'Knee-safe quad builder' }
    ];
  }
}
