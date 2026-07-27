import express from 'express';
import { generateWorkout, getTodayWorkout, getWorkoutRange, updateWorkoutStatus, generateWeekOfWorkouts } from '../controllers/workoutController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate', generateWorkout);
router.post('/generate-week', generateWeekOfWorkouts);
router.get('/today', getTodayWorkout);
router.get('/', getWorkoutRange);
router.patch('/:id/status', updateWorkoutStatus);

export default router;
