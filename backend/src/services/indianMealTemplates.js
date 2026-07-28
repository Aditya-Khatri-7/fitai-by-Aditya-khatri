// Real dish names and ingredients sourced from datasets/raw/indian_food/indian_food.csv
// (255 real Indian dishes with a vegetarian/non-vegetarian diet field). That dataset
// has no calorie/macro columns, so per-food macro values here are reasonable estimates
// based on standard nutrition references for these dishes — not measured, but the
// dishes themselves are real, not invented. This replaces the old fallback's single
// hardcoded template (which served "Grilled Chicken" to vegetarians regardless of
// their stated diet type).

const VEG_BREAKFAST = [
  { name: 'Poha', prepTime: 15, foods: [{ name: 'Beaten Rice Poha', quantity: '150g', calories: 270, protein: 5, carbs: 55, fat: 4, fiber: 3 }, { name: 'Peanuts & Curry Leaves Tempering', quantity: '20g', calories: 110, protein: 4, carbs: 4, fat: 9, fiber: 2 }] },
  { name: 'Masala Dosa with Sambar', prepTime: 20, foods: [{ name: 'Masala Dosa (rice & lentil crepe)', quantity: '2 pcs', calories: 320, protein: 7, carbs: 58, fat: 7, fiber: 4 }, { name: 'Sambar', quantity: '150ml', calories: 120, protein: 6, carbs: 18, fat: 3, fiber: 5 }] },
  { name: 'Idli with Coconut Chutney', prepTime: 15, foods: [{ name: 'Steamed Idli', quantity: '4 pcs', calories: 280, protein: 8, carbs: 56, fat: 2, fiber: 3 }, { name: 'Coconut Chutney', quantity: '40g', calories: 90, protein: 1, carbs: 4, fat: 8, fiber: 2 }] },
  { name: 'Upma with Vegetables', prepTime: 15, foods: [{ name: 'Vegetable Upma (semolina)', quantity: '200g', calories: 310, protein: 8, carbs: 50, fat: 9, fiber: 4 }] }
];

const VEG_LUNCH_DINNER = [
  { name: 'Dal Makhani with Rice', prepTime: 30, foods: [{ name: 'Dal Makhani (lentils)', quantity: '250g', calories: 380, protein: 16, carbs: 40, fat: 16, fiber: 12 }, { name: 'Steamed Rice', quantity: '150g', calories: 195, protein: 4, carbs: 43, fat: 0, fiber: 1 }] },
  { name: 'Rajma Chaval', prepTime: 35, foods: [{ name: 'Rajma (kidney bean curry)', quantity: '250g', calories: 340, protein: 17, carbs: 44, fat: 8, fiber: 14 }, { name: 'Steamed Rice', quantity: '150g', calories: 195, protein: 4, carbs: 43, fat: 0, fiber: 1 }] },
  { name: 'Palak Paneer with Roti', prepTime: 25, foods: [{ name: 'Palak Paneer (spinach & cottage cheese)', quantity: '220g', calories: 380, protein: 18, carbs: 12, fat: 28, fiber: 5 }, { name: 'Whole Wheat Roti', quantity: '2 pcs', calories: 160, protein: 6, carbs: 30, fat: 3, fiber: 4 }] },
  { name: 'Chana Masala with Rice', prepTime: 25, foods: [{ name: 'Chana Masala (chickpea curry)', quantity: '250g', calories: 320, protein: 15, carbs: 45, fat: 9, fiber: 13 }, { name: 'Steamed Rice', quantity: '150g', calories: 195, protein: 4, carbs: 43, fat: 0, fiber: 1 }] },
  { name: 'Aloo Gobi with Roti', prepTime: 25, foods: [{ name: 'Aloo Gobi (potato & cauliflower)', quantity: '250g', calories: 280, protein: 6, carbs: 40, fat: 11, fiber: 7 }, { name: 'Whole Wheat Roti', quantity: '2 pcs', calories: 160, protein: 6, carbs: 30, fat: 3, fiber: 4 }] }
];

const VEG_SNACK = [
  { name: 'Dhokla', prepTime: 10, foods: [{ name: 'Steamed Dhokla (gram flour)', quantity: '150g', calories: 220, protein: 9, carbs: 32, fat: 6, fiber: 3 }] },
  { name: 'Roasted Chana & Fruit', prepTime: 5, foods: [{ name: 'Roasted Chickpeas', quantity: '50g', calories: 180, protein: 10, carbs: 27, fat: 3, fiber: 8 }, { name: 'Seasonal Fruit', quantity: '1 medium', calories: 90, protein: 1, carbs: 22, fat: 0, fiber: 3 }] }
];

const NONVEG_LUNCH_DINNER = [
  { name: 'Butter Chicken with Rice', prepTime: 35, foods: [{ name: 'Butter Chicken', quantity: '250g', calories: 450, protein: 30, carbs: 12, fat: 30, fiber: 2 }, { name: 'Steamed Rice', quantity: '150g', calories: 195, protein: 4, carbs: 43, fat: 0, fiber: 1 }] },
  { name: 'Tandoori Chicken with Roti', prepTime: 40, foods: [{ name: 'Tandoori Chicken', quantity: '250g', calories: 320, protein: 40, carbs: 4, fat: 15, fiber: 0 }, { name: 'Whole Wheat Roti', quantity: '2 pcs', calories: 160, protein: 6, carbs: 30, fat: 3, fiber: 4 }] },
  { name: 'Chicken Biryani', prepTime: 45, foods: [{ name: 'Chicken Biryani', quantity: '350g', calories: 520, protein: 28, carbs: 60, fat: 18, fiber: 3 }] },
  { name: 'Maach Jhol (Fish Curry) with Rice', prepTime: 30, foods: [{ name: 'Maach Jhol (fish curry)', quantity: '250g', calories: 310, protein: 32, carbs: 8, fat: 16, fiber: 2 }, { name: 'Steamed Rice', quantity: '150g', calories: 195, protein: 4, carbs: 43, fat: 0, fiber: 1 }] }
];

// Vegan is a subset of the veg pool, filtered to exclude the dairy-heavy dishes above.
const VEGAN_LUNCH_DINNER = [
  { name: 'Rajma Chaval', prepTime: 35, foods: [{ name: 'Rajma (kidney bean curry, no dairy)', quantity: '250g', calories: 340, protein: 17, carbs: 44, fat: 8, fiber: 14 }, { name: 'Steamed Rice', quantity: '150g', calories: 195, protein: 4, carbs: 43, fat: 0, fiber: 1 }] },
  { name: 'Chana Masala with Rice', prepTime: 25, foods: [{ name: 'Chana Masala (chickpea curry, no dairy)', quantity: '250g', calories: 320, protein: 15, carbs: 45, fat: 9, fiber: 13 }, { name: 'Steamed Rice', quantity: '150g', calories: 195, protein: 4, carbs: 43, fat: 0, fiber: 1 }] },
  { name: 'Aloo Gobi with Roti', prepTime: 25, foods: [{ name: 'Aloo Gobi (potato & cauliflower, no dairy)', quantity: '250g', calories: 280, protein: 6, carbs: 40, fat: 11, fiber: 7 }, { name: 'Whole Wheat Roti', quantity: '2 pcs', calories: 160, protein: 6, carbs: 30, fat: 3, fiber: 4 }] }
];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/** Returns one real, diet-appropriate dish for a single meal slot (used by the
 * per-meal "Swap This Meal" regenerate fallback). */
export function pickSingleMeal(mealType, dietType) {
  const isVegan = dietType === 'vegan';
  const isVeg = dietType === 'vegetarian' || isVegan;

  if (mealType === 'breakfast') return pick(VEG_BREAKFAST);
  if (mealType === 'snack') return pick(VEG_SNACK);

  const pool = isVegan ? VEGAN_LUNCH_DINNER : isVeg ? VEG_LUNCH_DINNER : [...VEG_LUNCH_DINNER, ...NONVEG_LUNCH_DINNER];
  return pick(pool);
}

/** Returns a real, diet-appropriate meal plan built from actual Indian dish names.
 * Vegetarian/vegan users only ever get dishes from the veg/vegan pools — never the
 * non-veg pool — directly fixing the diet-type-blind hardcoded fallback this replaces. */
export function buildIndianMealPlan(dietType) {
  const isVegan = dietType === 'vegan';
  const isVeg = dietType === 'vegetarian' || isVegan;

  const lunchDinnerPool = isVegan ? VEGAN_LUNCH_DINNER : isVeg ? VEG_LUNCH_DINNER : [...VEG_LUNCH_DINNER, ...NONVEG_LUNCH_DINNER];
  const snackPool = VEG_SNACK; // no non-veg entries needed in the source dataset's snack course

  const breakfast = pick(VEG_BREAKFAST);
  const lunch = pick(lunchDinnerPool);
  const snack = pick(snackPool);
  let dinner = pick(lunchDinnerPool);
  if (dinner.name === lunch.name && lunchDinnerPool.length > 1) {
    dinner = lunchDinnerPool.find(m => m.name !== lunch.name) || dinner;
  }

  return [
    { type: 'breakfast', ...breakfast },
    { type: 'lunch', ...lunch },
    { type: 'snack', ...snack },
    { type: 'dinner', ...dinner }
  ];
}
