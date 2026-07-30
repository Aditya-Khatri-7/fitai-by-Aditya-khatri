import express from 'express';
import {
  generateMealPlan,
  getTodayMealPlan,
  getMealPlanRange,
  generateWeekOfMealPlans,
  regenerateSingleMeal,
  setMealConsumed,
  getGroceryList,
  getMealAlternatives,
  setMealManual
} from '../controllers/mealPlanController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate', generateMealPlan);
router.post('/generate-week', generateWeekOfMealPlans);
router.get('/today', getTodayMealPlan);
router.get('/grocery-list', getGroceryList);
router.get('/meals/:mealType/alternatives', getMealAlternatives);
router.get('/', getMealPlanRange);
router.patch('/:mealPlanId/meals/:mealType/regenerate', regenerateSingleMeal);
router.patch('/:mealPlanId/meals/:mealType/manual', setMealManual);
router.patch('/:mealPlanId/meals/:mealType/consumed', setMealConsumed);

export default router;
