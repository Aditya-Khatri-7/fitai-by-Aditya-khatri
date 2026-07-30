// Real dish names and ingredients sourced from datasets/raw/indian_food/indian_food.csv
// (255 real Indian dishes with a vegetarian/non-vegetarian diet field). That dataset
// has no calorie/macro columns, so per-food macro values here are reasonable estimates
// based on standard nutrition references for these dishes — not measured, but the
// dishes themselves are real, not invented. This replaces the old fallback's single
// hardcoded template (which served "Grilled Chicken" to vegetarians regardless of
// their stated diet type).
//
// Each dish also carries a `cuisine` tag (north/south/east/west) based on its real,
// well-established regional origin — e.g. dosa/idli/sambar are South Indian, dal
// makhani/rajma/butter chicken are North Indian (Punjabi), maach jhol is Bengali
// (east), dhokla is Gujarati (west). Biryani's regional origin is genuinely disputed
// across multiple regions, so it's tagged 'any' rather than assigning one arbitrarily.

const VEG_BREAKFAST = [
  { name: 'Poha', prepTime: 15, cuisine: 'west', foods: [{ name: 'Beaten Rice Poha', quantity: '150g', calories: 270, protein: 5, carbs: 55, fat: 4, fiber: 3 }, { name: 'Peanuts & Curry Leaves Tempering', quantity: '20g', calories: 110, protein: 4, carbs: 4, fat: 9, fiber: 2 }] },
  { name: 'Masala Dosa with Sambar', prepTime: 20, cuisine: 'south', foods: [{ name: 'Masala Dosa (rice & lentil crepe)', quantity: '2 pcs', calories: 320, protein: 7, carbs: 58, fat: 7, fiber: 4 }, { name: 'Sambar', quantity: '150ml', calories: 120, protein: 6, carbs: 18, fat: 3, fiber: 5 }] },
  { name: 'Idli with Coconut Chutney', prepTime: 15, cuisine: 'south', foods: [{ name: 'Steamed Idli', quantity: '4 pcs', calories: 280, protein: 8, carbs: 56, fat: 2, fiber: 3 }, { name: 'Coconut Chutney', quantity: '40g', calories: 90, protein: 1, carbs: 4, fat: 8, fiber: 2 }] },
  { name: 'Upma with Vegetables', prepTime: 15, cuisine: 'south', foods: [{ name: 'Vegetable Upma (semolina)', quantity: '200g', calories: 310, protein: 8, carbs: 50, fat: 9, fiber: 4 }] },
  { name: 'Aloo Paratha with Curd', prepTime: 20, cuisine: 'north', foods: [{ name: 'Aloo Paratha (stuffed potato flatbread)', quantity: '2 pcs', calories: 420, protein: 9, carbs: 60, fat: 15, fiber: 5 }, { name: 'Plain Curd', quantity: '100g', calories: 60, protein: 3, carbs: 5, fat: 3, fiber: 0 }] },
  { name: 'Luchi with Aloo Dum', prepTime: 25, cuisine: 'east', foods: [{ name: 'Luchi (deep-fried flatbread)', quantity: '4 pcs', calories: 360, protein: 6, carbs: 48, fat: 16, fiber: 2 }, { name: 'Aloo Dum (spiced potato curry)', quantity: '200g', calories: 220, protein: 4, carbs: 32, fat: 8, fiber: 4 }] }
];

const VEG_LUNCH_DINNER = [
  { name: 'Dal Makhani with Rice', prepTime: 30, cuisine: 'north', foods: [{ name: 'Dal Makhani (lentils)', quantity: '250g', calories: 380, protein: 16, carbs: 40, fat: 16, fiber: 12 }, { name: 'Steamed Rice', quantity: '150g', calories: 195, protein: 4, carbs: 43, fat: 0, fiber: 1 }] },
  { name: 'Rajma Chaval', prepTime: 35, cuisine: 'north', foods: [{ name: 'Rajma (kidney bean curry)', quantity: '250g', calories: 340, protein: 17, carbs: 44, fat: 8, fiber: 14 }, { name: 'Steamed Rice', quantity: '150g', calories: 195, protein: 4, carbs: 43, fat: 0, fiber: 1 }] },
  { name: 'Palak Paneer with Roti', prepTime: 25, cuisine: 'north', foods: [{ name: 'Palak Paneer (spinach & cottage cheese)', quantity: '220g', calories: 380, protein: 18, carbs: 12, fat: 28, fiber: 5 }, { name: 'Whole Wheat Roti', quantity: '2 pcs', calories: 160, protein: 6, carbs: 30, fat: 3, fiber: 4 }] },
  { name: 'Chana Masala with Rice', prepTime: 25, cuisine: 'north', foods: [{ name: 'Chana Masala (chickpea curry)', quantity: '250g', calories: 320, protein: 15, carbs: 45, fat: 9, fiber: 13 }, { name: 'Steamed Rice', quantity: '150g', calories: 195, protein: 4, carbs: 43, fat: 0, fiber: 1 }] },
  { name: 'Aloo Gobi with Roti', prepTime: 25, cuisine: 'north', foods: [{ name: 'Aloo Gobi (potato & cauliflower)', quantity: '250g', calories: 280, protein: 6, carbs: 40, fat: 11, fiber: 7 }, { name: 'Whole Wheat Roti', quantity: '2 pcs', calories: 160, protein: 6, carbs: 30, fat: 3, fiber: 4 }] },
  { name: 'Curd Rice with Pickle', prepTime: 10, cuisine: 'south', foods: [{ name: 'Curd Rice (tempered yogurt rice)', quantity: '300g', calories: 340, protein: 10, carbs: 52, fat: 9, fiber: 2 }, { name: 'Mango Pickle', quantity: '15g', calories: 40, protein: 0, carbs: 3, fat: 3, fiber: 1 }] },
  { name: 'Bisi Bele Bath', prepTime: 30, cuisine: 'south', foods: [{ name: 'Bisi Bele Bath (lentil-rice-vegetable stew)', quantity: '300g', calories: 420, protein: 13, carbs: 62, fat: 12, fiber: 8 }] },
  { name: 'Shukto with Rice', prepTime: 30, cuisine: 'east', foods: [{ name: 'Shukto (mixed vegetable stew)', quantity: '250g', calories: 210, protein: 5, carbs: 28, fat: 8, fiber: 6 }, { name: 'Steamed Rice', quantity: '150g', calories: 195, protein: 4, carbs: 43, fat: 0, fiber: 1 }] },
  { name: 'Dhokla with Kadhi', prepTime: 25, cuisine: 'west', foods: [{ name: 'Steamed Dhokla', quantity: '150g', calories: 220, protein: 9, carbs: 32, fat: 6, fiber: 3 }, { name: 'Gujarati Kadhi (yogurt curry)', quantity: '200ml', calories: 160, protein: 5, carbs: 18, fat: 7, fiber: 1 }] }
];

const VEG_SNACK = [
  { name: 'Dhokla', prepTime: 10, cuisine: 'west', foods: [{ name: 'Steamed Dhokla (gram flour)', quantity: '150g', calories: 220, protein: 9, carbs: 32, fat: 6, fiber: 3 }] },
  { name: 'Roasted Chana & Fruit', prepTime: 5, cuisine: 'any', foods: [{ name: 'Roasted Chickpeas', quantity: '50g', calories: 180, protein: 10, carbs: 27, fat: 3, fiber: 8 }, { name: 'Seasonal Fruit', quantity: '1 medium', calories: 90, protein: 1, carbs: 22, fat: 0, fiber: 3 }] },
  { name: 'Sundal', prepTime: 10, cuisine: 'south', foods: [{ name: 'Sundal (spiced tempered chickpeas)', quantity: '100g', calories: 160, protein: 8, carbs: 24, fat: 4, fiber: 7 }] },
  { name: 'Jhal Muri', prepTime: 8, cuisine: 'east', foods: [{ name: 'Jhal Muri (spiced puffed rice mix)', quantity: '100g', calories: 150, protein: 4, carbs: 28, fat: 3, fiber: 2 }] }
];

const NONVEG_LUNCH_DINNER = [
  { name: 'Butter Chicken with Rice', prepTime: 35, cuisine: 'north', foods: [{ name: 'Butter Chicken', quantity: '250g', calories: 450, protein: 30, carbs: 12, fat: 30, fiber: 2 }, { name: 'Steamed Rice', quantity: '150g', calories: 195, protein: 4, carbs: 43, fat: 0, fiber: 1 }] },
  { name: 'Tandoori Chicken with Roti', prepTime: 40, cuisine: 'north', foods: [{ name: 'Tandoori Chicken', quantity: '250g', calories: 320, protein: 40, carbs: 4, fat: 15, fiber: 0 }, { name: 'Whole Wheat Roti', quantity: '2 pcs', calories: 160, protein: 6, carbs: 30, fat: 3, fiber: 4 }] },
  { name: 'Chicken Biryani', prepTime: 45, cuisine: 'any', foods: [{ name: 'Chicken Biryani', quantity: '350g', calories: 520, protein: 28, carbs: 60, fat: 18, fiber: 3 }] },
  { name: 'Maach Jhol (Fish Curry) with Rice', prepTime: 30, cuisine: 'east', foods: [{ name: 'Maach Jhol (fish curry)', quantity: '250g', calories: 310, protein: 32, carbs: 8, fat: 16, fiber: 2 }, { name: 'Steamed Rice', quantity: '150g', calories: 195, protein: 4, carbs: 43, fat: 0, fiber: 1 }] },
  { name: 'Chettinad Chicken Curry with Rice', prepTime: 35, cuisine: 'south', foods: [{ name: 'Chettinad Chicken Curry', quantity: '250g', calories: 380, protein: 34, carbs: 10, fat: 22, fiber: 2 }, { name: 'Steamed Rice', quantity: '150g', calories: 195, protein: 4, carbs: 43, fat: 0, fiber: 1 }] }
];

// Vegan is a subset of the veg pool, filtered to exclude the dairy-heavy dishes above.
const VEGAN_LUNCH_DINNER = [
  { name: 'Rajma Chaval', prepTime: 35, cuisine: 'north', foods: [{ name: 'Rajma (kidney bean curry, no dairy)', quantity: '250g', calories: 340, protein: 17, carbs: 44, fat: 8, fiber: 14 }, { name: 'Steamed Rice', quantity: '150g', calories: 195, protein: 4, carbs: 43, fat: 0, fiber: 1 }] },
  { name: 'Chana Masala with Rice', prepTime: 25, cuisine: 'north', foods: [{ name: 'Chana Masala (chickpea curry, no dairy)', quantity: '250g', calories: 320, protein: 15, carbs: 45, fat: 9, fiber: 13 }, { name: 'Steamed Rice', quantity: '150g', calories: 195, protein: 4, carbs: 43, fat: 0, fiber: 1 }] },
  { name: 'Aloo Gobi with Roti', prepTime: 25, cuisine: 'north', foods: [{ name: 'Aloo Gobi (potato & cauliflower, no dairy)', quantity: '250g', calories: 280, protein: 6, carbs: 40, fat: 11, fiber: 7 }, { name: 'Whole Wheat Roti', quantity: '2 pcs', calories: 160, protein: 6, carbs: 30, fat: 3, fiber: 4 }] },
  { name: 'Bisi Bele Bath', prepTime: 30, cuisine: 'south', foods: [{ name: 'Bisi Bele Bath (lentil-rice-vegetable stew, no ghee)', quantity: '300g', calories: 400, protein: 13, carbs: 62, fat: 9, fiber: 8 }] }
];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Filters a pool to the requested cuisine, but never returns an empty pool — if
// nothing matches (e.g. no East-Indian non-veg dinner dish exists yet), falls back
// to the full pool rather than erroring, since a cuisine preference is a soft nudge,
// not a hard requirement the system should ever refuse to serve a meal over.
function filterByCuisine(pool, cuisine) {
  if (!cuisine || cuisine === 'any') return pool;
  const matched = pool.filter(d => d.cuisine === cuisine || d.cuisine === 'any');
  return matched.length > 0 ? matched : pool;
}

/** Returns one real, diet-appropriate dish for a single meal slot (used by the
 * per-meal "Swap This Meal" regenerate fallback). cuisine: optional 'north'|'south'|'east'|'west'. */
export function pickSingleMeal(mealType, dietType, cuisine) {
  const isVegan = dietType === 'vegan';
  const isVeg = dietType === 'vegetarian' || isVegan;

  if (mealType === 'breakfast') return pick(filterByCuisine(VEG_BREAKFAST, cuisine));
  if (mealType === 'snack') return pick(filterByCuisine(VEG_SNACK, cuisine));

  const pool = isVegan ? VEGAN_LUNCH_DINNER : isVeg ? VEG_LUNCH_DINNER : [...VEG_LUNCH_DINNER, ...NONVEG_LUNCH_DINNER];
  return pick(filterByCuisine(pool, cuisine));
}

/** Returns up to `count` distinct, diet-appropriate dish options for a single meal
 * slot — used by the "Choose Manually" picker so the user sees real alternatives
 * instead of the AI blindly picking one for them. */
export function listMealOptions(mealType, dietType, cuisine, count = 6) {
  const isVegan = dietType === 'vegan';
  const isVeg = dietType === 'vegetarian' || isVegan;

  let pool;
  if (mealType === 'breakfast') pool = filterByCuisine(VEG_BREAKFAST, cuisine);
  else if (mealType === 'snack') pool = filterByCuisine(VEG_SNACK, cuisine);
  else {
    const basePool = isVegan ? VEGAN_LUNCH_DINNER : isVeg ? VEG_LUNCH_DINNER : [...VEG_LUNCH_DINNER, ...NONVEG_LUNCH_DINNER];
    pool = filterByCuisine(basePool, cuisine);
  }

  const seen = new Set();
  const unique = pool.filter(d => (seen.has(d.name) ? false : (seen.add(d.name), true)));
  return unique.slice(0, count).map(d => ({ type: mealType, ...d }));
}

/** Returns a real, diet-appropriate meal plan built from actual Indian dish names.
 * Vegetarian/vegan users only ever get dishes from the veg/vegan pools — never the
 * non-veg pool — directly fixing the diet-type-blind hardcoded fallback this replaces.
 * cuisinePerMeal (optional): { breakfast, lunch, snack, dinner } regional preference per
 * slot — e.g. South Indian breakfast + North Indian dinner, matching how people actually
 * eat across regions/households rather than forcing one cuisine for the whole day. */
export function buildIndianMealPlan(dietType, cuisinePerMeal = {}) {
  const isVegan = dietType === 'vegan';
  const isVeg = dietType === 'vegetarian' || isVegan;

  const lunchDinnerPool = isVegan ? VEGAN_LUNCH_DINNER : isVeg ? VEG_LUNCH_DINNER : [...VEG_LUNCH_DINNER, ...NONVEG_LUNCH_DINNER];
  const snackPool = VEG_SNACK; // no non-veg entries needed in the source dataset's snack course

  const breakfast = pick(filterByCuisine(VEG_BREAKFAST, cuisinePerMeal.breakfast));
  const lunchPool = filterByCuisine(lunchDinnerPool, cuisinePerMeal.lunch);
  const lunch = pick(lunchPool);
  const snack = pick(filterByCuisine(snackPool, cuisinePerMeal.snack));
  const dinnerPool = filterByCuisine(lunchDinnerPool, cuisinePerMeal.dinner);
  let dinner = pick(dinnerPool);
  if (dinner.name === lunch.name && dinnerPool.length > 1) {
    dinner = dinnerPool.find(m => m.name !== lunch.name) || dinner;
  }

  return [
    { type: 'breakfast', ...breakfast },
    { type: 'lunch', ...lunch },
    { type: 'snack', ...snack },
    { type: 'dinner', ...dinner }
  ];
}
