import MealPlan from '../models/MealPlan.js';
import { generateMealPlanWithAI, regenerateSingleMealWithAI } from '../services/aiService.js';

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildNutritionContext(user, overrides = {}) {
  return {
    goal: user.currentGoal,
    dietType: user.preferences?.dietType,
    budget: user.preferences?.budget,
    cookingSkill: user.preferences?.cookingSkill,
    allergies: user.healthProfile?.allergies || [],
    chronicConditions: user.healthProfile?.chronicConditions || [],
    ...overrides
  };
}

export async function generateMealPlan(req, res) {
  try {
    const userContext = buildNutritionContext(req.user, req.body || {});
    const aiPlan = await generateMealPlanWithAI(userContext);

    const date = req.body?.date ? startOfDay(req.body.date) : startOfDay(new Date());
    const existing = await MealPlan.findOne({ userId: req.user._id, date });
    const mealPlan = existing ? Object.assign(existing, aiPlan) : new MealPlan({ ...aiPlan, userId: req.user._id, date });
    await mealPlan.save();

    res.json(mealPlan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getTodayMealPlan(req, res) {
  try {
    const mealPlan = await MealPlan.findOne({ userId: req.user._id, date: startOfDay(new Date()) }).sort({ createdAt: -1 });
    if (!mealPlan) {
      return res.status(404).json({ exists: false, message: 'No meal plan generated yet for today.' });
    }
    res.json(mealPlan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getMealPlanRange(req, res) {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: 'Query params "from" and "to" (YYYY-MM-DD) are required.' });
    }
    const mealPlans = await MealPlan.find({
      userId: req.user._id,
      date: { $gte: startOfDay(from), $lte: new Date(new Date(to).setHours(23, 59, 59, 999)) }
    }).sort({ date: 1 });
    res.json(mealPlans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function generateWeekOfMealPlans(req, res) {
  try {
    const weekStartDate = req.body?.weekStartDate ? startOfDay(req.body.weekStartDate) : startOfDay(new Date());
    const userContext = buildNutritionContext(req.user);

    const created = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStartDate);
      date.setDate(date.getDate() + i);

      const aiPlan = await generateMealPlanWithAI(userContext);
      const existing = await MealPlan.findOne({ userId: req.user._id, date });
      const mealPlan = existing ? Object.assign(existing, aiPlan) : new MealPlan({ ...aiPlan, userId: req.user._id, date });
      await mealPlan.save();
      created.push(mealPlan);
    }

    res.json(created);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function regenerateSingleMeal(req, res) {
  try {
    const { mealPlanId, mealType } = req.params;
    const mealPlan = await MealPlan.findOne({ _id: mealPlanId, userId: req.user._id });
    if (!mealPlan) return res.status(404).json({ message: 'Meal plan not found' });

    const userContext = buildNutritionContext(req.user);
    const newMeal = await regenerateSingleMealWithAI(mealType, userContext);

    const idx = mealPlan.meals.findIndex(m => m.type === mealType);
    if (idx !== -1) mealPlan.meals[idx] = newMeal;
    else mealPlan.meals.push(newMeal);

    mealPlan.dailyTotals = mealPlan.meals.reduce((acc, m) => ({
      calories: acc.calories + (m.totalCalories || 0),
      protein: acc.protein + (m.foods || []).reduce((s, f) => s + (f.protein || 0), 0),
      carbs: acc.carbs + (m.foods || []).reduce((s, f) => s + (f.carbs || 0), 0),
      fat: acc.fat + (m.foods || []).reduce((s, f) => s + (f.fat || 0), 0),
      fiber: acc.fiber + (m.foods || []).reduce((s, f) => s + (f.fiber || 0), 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    await mealPlan.save();
    res.json({ mealPlan, updatedMeal: newMeal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getGroceryList(req, res) {
  try {
    const { from, to } = req.query;
    const rangeFrom = from ? startOfDay(from) : startOfDay(new Date());
    const rangeTo = to ? new Date(new Date(to).setHours(23, 59, 59, 999)) : new Date(new Date(rangeFrom).setDate(rangeFrom.getDate() + 6));

    const mealPlans = await MealPlan.find({ userId: req.user._id, date: { $gte: rangeFrom, $lte: rangeTo } });

    const itemMap = new Map();
    for (const plan of mealPlans) {
      for (const meal of plan.meals || []) {
        for (const food of meal.foods || []) {
          const key = food.name.toLowerCase().trim();
          if (!itemMap.has(key)) {
            itemMap.set(key, { name: food.name, quantities: [], mealsUsedIn: 0 });
          }
          const entry = itemMap.get(key);
          if (food.quantity) entry.quantities.push(food.quantity);
          entry.mealsUsedIn += 1;
        }
      }
    }

    const items = Array.from(itemMap.values()).map(({ name, quantities, mealsUsedIn }) => ({
      name,
      totalQuantity: quantities.join(' + '),
      mealsUsedIn
    }));

    res.json({ from: rangeFrom, to: rangeTo, items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
