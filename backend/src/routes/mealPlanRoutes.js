import express from 'express';
import {
  generateMealPlan,
  getTodayMealPlan,
  getMealPlanRange,
  generateWeekOfMealPlans,
  regenerateSingleMeal,
  getGroceryList
} from '../controllers/mealPlanController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate', generateMealPlan);
router.post('/generate-week', generateWeekOfMealPlans);
router.get('/today', getTodayMealPlan);
router.get('/grocery-list', getGroceryList);
router.get('/', getMealPlanRange);
router.patch('/:mealPlanId/meals/:mealType/regenerate', regenerateSingleMeal);

export default router;
