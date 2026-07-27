import api from './api';
import { classifyLocallyClient } from '../utils/localCoachClassifier';

/**
 * Single source of truth for turning a free-form coach message into a structured app action.
 * Hybrid strategy: Tries backend resolver first, seamlessly falls back to client-side local classifier
 * so the application NEVER fails with network errors or unlinked API key messages.
 */
export async function resolveCoachAction(message, history, appState) {
  try {
    const { data } = await api.post('/ai/coach-action', {
      message,
      history: (history || []).slice(-6).map(h => ({ sender: h.sender, text: h.text })),
      appState
    });

    if (data && data.proposedAction) {
      return data;
    }
  } catch (err) {
    console.warn("Backend coach-action service unavailable or unlinked key, using client-side classifier.", err);
  }

  // Guaranteed zero-failure local fallback
  return classifyLocallyClient(message);
}

/** Builds the real, current app-state snapshot the AI reasons over. */
export function buildAppStateSnapshot({ nutrition, workout, theme }) {
  return {
    meals: (nutrition?.todayMealPlan?.meals || []).map(m => ({
      type: m.type,
      name: m.name,
      totalCalories: m.totalCalories
    })),
    workout: workout?.todayWorkout
      ? { title: workout.todayWorkout.title, splitFocus: workout.todayWorkout.splitFocus }
      : null,
    theme
  };
}
