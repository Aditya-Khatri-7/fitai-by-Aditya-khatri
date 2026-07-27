import Workout from '../models/Workout.js';
import { generateWorkoutWithAI, generateWeeklyWorkoutPlanWithAI } from '../services/aiService.js';
import { applyStreakUpdate } from '../utils/streak.js';

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildUserContext(user, overrides = {}) {
  return {
    name: user.name,
    age: user.profile?.age,
    gender: user.profile?.gender,
    fitnessLevel: user.profile?.fitnessLevel,
    goal: user.currentGoal,
    equipment: user.equipment || [],
    workoutDuration: user.preferences?.workoutDuration,
    injuries: (user.injuries || []).filter(i => i.isActive),
    chronicConditions: user.healthProfile?.chronicConditions || [],
    ...overrides
  };
}

export async function generateWorkout(req, res) {
  try {
    const userContext = buildUserContext(req.user, req.body || {});
    const aiWorkout = await generateWorkoutWithAI(userContext);

    const date = req.body?.date ? startOfDay(req.body.date) : startOfDay(new Date());
    const existing = await Workout.findOne({ userId: req.user._id, date });
    const workout = existing
      ? Object.assign(existing, { ...aiWorkout, version: (existing.version || 1) + 1 })
      : new Workout({ ...aiWorkout, userId: req.user._id, date });
    await workout.save();

    res.json(workout);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getTodayWorkout(req, res) {
  try {
    const workout = await Workout.findOne({ userId: req.user._id, date: startOfDay(new Date()) }).sort({ createdAt: -1 });
    if (!workout) {
      return res.status(404).json({ exists: false, message: 'No workout generated yet for today.' });
    }
    res.json(workout);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getWorkoutRange(req, res) {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: 'Query params "from" and "to" (YYYY-MM-DD) are required.' });
    }
    const workouts = await Workout.find({
      userId: req.user._id,
      date: { $gte: startOfDay(from), $lte: new Date(new Date(to).setHours(23, 59, 59, 999)) }
    }).sort({ date: 1 });
    res.json(workouts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateWorkoutStatus(req, res) {
  try {
    const { status } = req.body;
    const workout = await Workout.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status },
      { new: true }
    );
    if (!workout) return res.status(404).json({ message: 'Workout not found' });

    if (status === 'completed') {
      await applyStreakUpdate(req.user);
    }

    res.json(workout);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function generateWeekOfWorkouts(req, res) {
  try {
    const weekStartDate = req.body?.weekStartDate ? startOfDay(req.body.weekStartDate) : startOfDay(new Date());
    const userContext = buildUserContext(req.user);
    const dayPlans = await generateWeeklyWorkoutPlanWithAI(userContext, weekStartDate.toISOString().split('T')[0]);

    const created = [];
    for (const dayPlan of dayPlans) {
      const date = new Date(weekStartDate);
      date.setDate(date.getDate() + dayPlan.dayOffset);

      const existing = await Workout.findOne({ userId: req.user._id, date });
      const { dayOffset, ...workoutFields } = dayPlan;
      const workout = existing
        ? Object.assign(existing, workoutFields)
        : new Workout({ ...workoutFields, userId: req.user._id, date });
      await workout.save();
      created.push(workout);
    }

    res.json(created);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
