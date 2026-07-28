import express from 'express';
import { generateWorkout, getTodayWorkout, getWorkoutRange, updateWorkoutStatus, generateWeekOfWorkouts, getStreak, pauseStreak } from '../controllers/workoutController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate', generateWorkout);
router.post('/generate-week', generateWeekOfWorkouts);
router.get('/today', getTodayWorkout);
router.get('/streak', getStreak);
router.post('/streak/pause', pauseStreak);
router.get('/', getWorkoutRange);
router.patch('/:id/status', updateWorkoutStatus);

export default router;
