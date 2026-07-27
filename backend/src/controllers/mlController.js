import { predictRecovery, predictInjury, recommendExercises, getMLMetrics } from '../services/mlClient.js';
import MLPrediction from '../models/MLPrediction.js';

export async function getMetrics(req, res) {
  const metrics = await getMLMetrics();
  if (!metrics) {
    return res.status(503).json({ message: 'ML metrics unavailable — service offline or not yet trained.' });
  }
  res.json(metrics);
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

export async function getExerciseRecommendations(req, res) {
  try {
    const query = req.body;
    const recommendations = await recommendExercises(query);
    res.json({ recommendations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
