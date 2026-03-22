/**
 * Calcolo grammi alimenti per ogni pasto.
 * Port esatto da Python: calculations/meal_planner.py
 */

// Costanti fisse (dal foglio Excel)
export const FIXED_VEGETABLES_G = 200;
export const FIXED_OIL_ML = 10;
export const VEGETABLES_KCAL_100G = 25;
export const OIL_KCAL_100G = 900;
export const CARB_PCT_OF_MEAL = 0.54;

export interface FoodInfo {
  name: string;
  kcalPer100g: number;
}

export interface MainMealResult {
  vegetablesG: number;
  vegetablesKcal: number;
  oilMl: number;
  oilKcal: number;
  carbFood: string;
  carbGrams: number;
  carbKcal: number;
  proteinFood: string;
  proteinGrams: number;
  proteinKcal: number;
  totalKcal: number;
  targetKcal: number;
}

export interface BreakfastResult {
  milkMl: number;
  milkKcal: number;
  fruitKcal: number;
  mainFood: string;
  mainGrams: number;
  mainKcal: number;
  totalKcal: number;
}

export interface SnackResult {
  food: string;
  grams: number;
  kcal: number;
}

/** Calcola porzioni per pasto principale (pranzo/cena) */
export function calculateMainMeal(
  totalMealKcal: number,
  carbFood: FoodInfo | null,
  proteinFood: FoodInfo | null,
  vegetablesG: number = FIXED_VEGETABLES_G,
  oilMl: number = FIXED_OIL_ML
): MainMealResult {
  const vegKcal = (vegetablesG / 100) * VEGETABLES_KCAL_100G;
  const oilKcal = (oilMl / 100) * OIL_KCAL_100G;
  const availableKcal = totalMealKcal - vegKcal - oilKcal;

  // Kcal per carboidrati: 54% del pasto totale meno fisse
  let carbTargetKcal = totalMealKcal * CARB_PCT_OF_MEAL - vegKcal - oilKcal;
  carbTargetKcal = Math.max(0, carbTargetKcal);

  let carbGrams = 0;
  let carbActualKcal = 0;
  if (carbFood && carbFood.kcalPer100g > 0) {
    carbGrams = Math.round((carbTargetKcal / carbFood.kcalPer100g) * 100);
    carbActualKcal = (carbGrams / 100) * carbFood.kcalPer100g;
  }

  let proteinTargetKcal = Math.max(0, availableKcal - carbActualKcal);
  let proteinGrams = 0;
  let proteinActualKcal = 0;
  if (proteinFood && proteinFood.kcalPer100g > 0) {
    proteinGrams = Math.round(
      (proteinTargetKcal / proteinFood.kcalPer100g) * 100
    );
    proteinActualKcal = (proteinGrams / 100) * proteinFood.kcalPer100g;
  }

  const totalActualKcal = vegKcal + oilKcal + carbActualKcal + proteinActualKcal;

  return {
    vegetablesG,
    vegetablesKcal: round(vegKcal, 1),
    oilMl,
    oilKcal: round(oilKcal, 1),
    carbFood: carbFood?.name ?? "",
    carbGrams,
    carbKcal: round(carbActualKcal, 1),
    proteinFood: proteinFood?.name ?? "",
    proteinGrams,
    proteinKcal: round(proteinActualKcal, 1),
    totalKcal: round(totalActualKcal, 1),
    targetKcal: round(totalMealKcal, 1),
  };
}

/** Calcola porzioni colazione */
export function calculateBreakfast(
  totalMealKcal: number,
  mainFood: FoodInfo | null,
  hasMilk: boolean = true,
  hasFruit: boolean = true
): BreakfastResult {
  const milkKcal = hasMilk ? (250 / 100) * 46 : 0;
  const fruitKcal = hasFruit ? 60 : 0;
  const availableKcal = totalMealKcal - milkKcal - fruitKcal;

  let mainGrams = 0;
  let mainKcal = 0;
  if (mainFood && mainFood.kcalPer100g > 0) {
    mainGrams = Math.round((availableKcal / mainFood.kcalPer100g) * 100);
    mainKcal = (mainGrams / 100) * mainFood.kcalPer100g;
  }

  return {
    milkMl: hasMilk ? 250 : 0,
    milkKcal: round(milkKcal, 1),
    fruitKcal: round(fruitKcal, 1),
    mainFood: mainFood?.name ?? "",
    mainGrams,
    mainKcal: round(mainKcal, 1),
    totalKcal: round(totalMealKcal, 1),
  };
}

/** Calcola porzione spuntino */
export function calculateSnack(
  totalSnackKcal: number,
  food: FoodInfo | null
): SnackResult {
  if (!food || food.kcalPer100g <= 0) {
    return { food: "", grams: 0, kcal: 0 };
  }

  const grams = Math.round((totalSnackKcal / food.kcalPer100g) * 100);
  return {
    food: food.name,
    grams,
    kcal: round((grams / 100) * food.kcalPer100g, 1),
  };
}

/** Calcola grammi generico per un alimento dato kcal target */
export function calculateFoodPortion(
  kcalPer100g: number,
  targetKcal: number
): number {
  if (kcalPer100g <= 0) return 0;
  return Math.round((targetKcal / kcalPer100g) * 100);
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
