import { predictRecovery, predictInjury, recommendExercises, getMLMetrics, predictBodyFat, predictDiabetesRisk, predictCardioRisk, recommendMeditation, predictYogaPose, predictMealPhoto, predictStressLevel, listActivitySamples, classifyActivitySample } from '../services/mlClient.js';
import MLPrediction from '../models/MLPrediction.js';

export async function getMetrics(req, res) {
  try {
    const metrics = await getMLMetrics();
    if (!metrics) {
      return res.status(503).json({ message: 'ML metrics unavailable — service offline or not yet trained.' });
    }
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getRecoveryPrediction(req, res) {
  const start = Date.now();
  try {
    const biometrics = req.body;
    const result = await predictRecovery(biometrics);
    
    // Save audit prediction
    await MLPrediction.create({
      predictionType: 'recovery',
      input: biometrics,
      output: result,
      latencyMs: Date.now() - start
    }).catch(err => console.warn('Prediction logging skipped'));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getInjuryPrediction(req, res) {
  const start = Date.now();
  try {
    const userContext = req.body;
    const result = await predictInjury(userContext);

    await MLPrediction.create({
      predictionType: 'injury',
      input: userContext,
      output: result,
      latencyMs: Date.now() - start
    }).catch(err => console.warn('Prediction logging skipped'));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getBodyFatPrediction(req, res) {
  const start = Date.now();
  try {
    const measurements = req.body;
    const result = await predictBodyFat(measurements);

    await MLPrediction.create({
      userId: req.user._id,
      predictionType: 'bodyfat',
      input: measurements,
      output: result,
      latencyMs: Date.now() - start
    }).catch(err => console.warn('Prediction logging skipped'));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getDiabetesRiskScreen(req, res) {
  const start = Date.now();
  try {
    const screening = req.body;
    const result = await predictDiabetesRisk(screening);

    await MLPrediction.create({
      userId: req.user._id,
      predictionType: 'diabetes_risk',
      input: screening,
      output: result,
      latencyMs: Date.now() - start
    }).catch(err => console.warn('Prediction logging skipped'));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getCardioRiskScreen(req, res) {
  const start = Date.now();
  try {
    const screening = req.body;
    const result = await predictCardioRisk(screening);

    await MLPrediction.create({
      userId: req.user._id,
      predictionType: 'cardio_risk',
      input: screening,
      output: result,
      latencyMs: Date.now() - start
    }).catch(err => console.warn('Prediction logging skipped'));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getMeditationRecommendations(req, res) {
  const start = Date.now();
  try {
    const query = req.body;
    const recommendations = await recommendMeditation(query);

    await MLPrediction.create({
      userId: req.user._id,
      predictionType: 'meditation_recommendation',
      input: query,
      output: { count: recommendations.length },
      latencyMs: Date.now() - start
    }).catch(err => console.warn('Prediction logging skipped'));

    res.json({ recommendations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Rehab exercise suggestions reuse the already-trained, real megaGymDataset
// exercise recommender with a rehab-tuned query (low intensity, targeted body
// part, avoid-list built from the injury) — deliberately NOT the knee-rehab
// sensor/IMU dataset, which has no live sensor input path in this app (see
// /predict/rehab-status, exposed API-only for that reason). This gives
// InjuryManager.jsx a guaranteed-real suggestion regardless of that gap.
export async function getRehabExerciseSuggestions(req, res) {
  try {
    const { bodyPart, restrictions = [] } = req.body || {};
    const recommendations = await recommendExercises({
      goal: 'rehabilitation',
      target_muscles: bodyPart ? [bodyPart] : ['full_body'],
      equipment: ['body_only', 'dumbbell', 'resistance_band'],
      level: 'beginner',
      avoid: restrictions,
      top_k: 6
    });
    res.json({ recommendations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getYogaPosePrediction(req, res) {
  const start = Date.now();
  try {
    const { image_base64 } = req.body || {};
    if (!image_base64) return res.status(400).json({ message: 'image_base64 is required' });
    const result = await predictYogaPose(image_base64);

    // Never log the raw image bytes into the audit collection.
    await MLPrediction.create({
      userId: req.user._id,
      predictionType: 'yoga_pose',
      input: { image_provided: true },
      output: result,
      latencyMs: Date.now() - start
    }).catch(err => console.warn('Prediction logging skipped'));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getMealPhotoPrediction(req, res) {
  const start = Date.now();
  try {
    const { image_base64 } = req.body || {};
    if (!image_base64) return res.status(400).json({ message: 'image_base64 is required' });
    const result = await predictMealPhoto(image_base64);

    await MLPrediction.create({
      userId: req.user._id,
      predictionType: 'meal_photo',
      input: { image_provided: true },
      output: result,
      latencyMs: Date.now() - start
    }).catch(err => console.warn('Prediction logging skipped'));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getStressLevelPrediction(req, res) {
  const start = Date.now();
  try {
    const { skin_humidity, skin_temperature, steps } = req.body || {};
    if ([skin_humidity, skin_temperature, steps].some(v => v === undefined || v === null || Number.isNaN(Number(v)))) {
      return res.status(400).json({ message: 'skin_humidity, skin_temperature, and steps are required numeric fields.' });
    }

    const sensorReadings = req.body;
    const result = await predictStressLevel(sensorReadings);

    await MLPrediction.create({
      userId: req.user._id,
      predictionType: 'stress_level',
      input: sensorReadings,
      output: result,
      latencyMs: Date.now() - start
    }).catch(err => console.warn('Prediction logging skipped'));

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

export async function getActivitySamples(req, res) {
  try {
    const result = await listActivitySamples();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function classifyActivitySampleController(req, res) {
  const start = Date.now();
  try {
    const { sample_index } = req.body || {};
    if (typeof sample_index !== 'number') {
      return res.status(400).json({ message: 'sample_index (number) is required' });
    }
    const result = await classifyActivitySample(sample_index);

    await MLPrediction.create({
      userId: req.user._id,
      predictionType: 'activity_recognition',
      input: { sample_index },
      output: result,
      latencyMs: Date.now() - start
    }).catch(err => console.warn('Prediction logging skipped'));

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

export async function getExerciseRecommendations(req, res) {
  try {
    const query = req.body;
    const recommendations = await recommendExercises(query);
    res.json({ recommendations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
