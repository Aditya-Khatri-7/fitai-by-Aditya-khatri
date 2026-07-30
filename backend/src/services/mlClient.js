import axios from 'axios';
import { fallbackRecoveryScore, fallbackInjuryRisk, fallbackBodyFat, fallbackDiabetesRisk, fallbackCardioRisk } from '../utils/fallbacks.js';

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

export async function predictBodyFat(measurements) {
  try {
    const response = await mlApi.post('/predict/bodyfat', measurements);
    return response.data;
  } catch (error) {
    console.warn(`[mlClient Warning] Body fat ML call failed (${error.message}). Returning rule fallback.`);
    return fallbackBodyFat(measurements);
  }
}

export async function predictDiabetesRisk(screening) {
  try {
    const response = await mlApi.post('/predict/diabetes-risk', screening);
    return response.data;
  } catch (error) {
    console.warn(`[mlClient Warning] Diabetes risk ML call failed (${error.message}). Returning rule fallback.`);
    return fallbackDiabetesRisk(screening);
  }
}

export async function predictCardioRisk(screening) {
  try {
    const response = await mlApi.post('/predict/cardio-risk', screening);
    return response.data;
  } catch (error) {
    console.warn(`[mlClient Warning] Cardio risk ML call failed (${error.message}). Returning rule fallback.`);
    return fallbackCardioRisk(screening);
  }
}

export async function predictYogaPose(imageBase64) {
  try {
    const response = await mlApi.post('/predict/yoga-pose', { image_base64: imageBase64 });
    return response.data;
  } catch (error) {
    console.warn(`[mlClient Warning] Yoga pose ML call failed (${error.message}).`);
    // No honest rule-based fallback exists for image classification — surface
    // unavailability rather than fabricating a guess.
    return { error: 'Yoga pose model temporarily unavailable.' };
  }
}

export async function predictMealPhoto(imageBase64) {
  try {
    const response = await mlApi.post('/predict/meal-photo', { image_base64: imageBase64 });
    return response.data;
  } catch (error) {
    console.warn(`[mlClient Warning] Meal photo ML call failed (${error.message}).`);
    return { error: 'Meal photo model temporarily unavailable.' };
  }
}

export async function recommendMeals(query) {
  try {
    const response = await mlApi.post('/recommend/meals', query);
    return response.data.recommendations || [];
  } catch (error) {
    console.warn(`[mlClient Warning] Meal Recommender ML call failed (${error.message}). Caller should fall back to indianMealTemplates.`);
    return null;
  }
}

export async function recommendMeditation(query) {
  try {
    const response = await mlApi.post('/recommend/meditation', query);
    return response.data.recommendations || [];
  } catch (error) {
    console.warn(`[mlClient Warning] Meditation Recommender ML call failed (${error.message}).`);
    return [];
  }
}

// Pydantic 422s carry `detail` as an array of per-field error objects rather
// than a string — collapse that into one readable message instead of leaking
// the raw structure or masking it as a downtime error.
function extractClientErrorMessage(error) {
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return 'Invalid input: missing or malformed required fields.';
  return error.message;
}

export async function predictStressLevel(sensorReadings) {
  try {
    const response = await mlApi.post('/predict/stress-level', sensorReadings);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status < 500) {
      // Client sent a bad request — surface the real 4xx, don't mask it as
      // service downtime (the model is fine, the input wasn't).
      const clientError = new Error(extractClientErrorMessage(error));
      clientError.status = error.response.status;
      throw clientError;
    }
    console.warn(`[mlClient Warning] Stress level ML call failed (${error.message}).`);
    // No honest rule-based fallback exists for the skin-sensor stress model —
    // surface unavailability rather than guessing a class.
    return { error: 'Stress level model temporarily unavailable.' };
  }
}

export async function listActivitySamples() {
  try {
    const response = await mlApi.get('/demo/activity-samples');
    return response.data;
  } catch (error) {
    console.warn(`[mlClient Warning] Activity sample list fetch failed (${error.message}).`);
    return { samples: [], feature_count: 0 };
  }
}

export async function classifyActivitySample(sampleIndex) {
  try {
    const response = await mlApi.post('/demo/classify-activity-sample', { sample_index: sampleIndex });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status < 500) {
      const clientError = new Error(extractClientErrorMessage(error));
      clientError.status = error.response.status;
      throw clientError;
    }
    console.warn(`[mlClient Warning] Activity classification failed (${error.message}).`);
    return { error: 'Activity recognition model temporarily unavailable.' };
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
