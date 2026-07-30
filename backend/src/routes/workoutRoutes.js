import express from 'express';
import { generateWorkout, generateYogaWorkout, getTodayWorkout, getWorkoutRange, updateWorkoutStatus, updateWorkoutEdit, generateWeekOfWorkouts, getStreak, pauseStreak, getWorkoutVersions } from '../controllers/workoutController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate', generateWorkout);
router.post('/generate-yoga', generateYogaWorkout);
router.post('/generate-week', generateWeekOfWorkouts);
router.get('/today', getTodayWorkout);
router.get('/streak', getStreak);
router.post('/streak/pause', pauseStreak);
router.get('/', getWorkoutRange);
router.patch('/:id/status', updateWorkoutStatus);
router.get('/:id/versions', getWorkoutVersions);
router.patch('/:id', updateWorkoutEdit);

export default router;
