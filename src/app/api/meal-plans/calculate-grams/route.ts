import { NextResponse } from "next/server";
import {
  calculateFoodPortion,
  FIXED_VEGETABLES_G,
  FIXED_OIL_ML,
  VEGETABLES_KCAL_100G,
  OIL_KCAL_100G,
  CARB_PCT_OF_MEAL,
} from "@/lib/calculations/meal-planner";

interface FoodInput {
  food_id?: string;
  kcal_100g: number;
  role?: string;
  is_fixed?: boolean;
  grams_rest?: number;
}

export async function POST(request: Request) {
  const data = await request.json();
  const mealType: string = data.meal_type ?? "";
  const kcalRest: number = data.kcal_rest ?? 0;
  const kcalW1: number | null = data.kcal_workout1 ?? null;
  const kcalW2: number | null = data.kcal_workout2 ?? null;
  const foods: FoodInput[] = data.foods ?? [];

  const kcalVariants = [kcalRest];
  if (kcalW1 != null) kcalVariants.push(kcalW1);
  if (kcalW2 != null) kcalVariants.push(kcalW2);

  const results = foods.map((food) => {
    if (food.is_fixed) {
      return {
        food_id: food.food_id,
        grams_rest: food.grams_rest ?? 200,
        grams_workout1: kcalW1 != null ? (food.grams_rest ?? 200) : null,
        grams_workout2: kcalW2 != null ? (food.grams_rest ?? 200) : null,
      };
    }

    const kcal100g = food.kcal_100g ?? 0;
    const role = food.role ?? "carb";
    const gramsList: number[] = [];

    for (const kcal of kcalVariants) {
      if (["PRANZO", "CENA"].includes(mealType)) {
        const vegKcal = (FIXED_VEGETABLES_G / 100) * VEGETABLES_KCAL_100G;
        const oilKcal = (FIXED_OIL_ML / 100) * OIL_KCAL_100G;

        let target: number;
        if (role === "carb") {
          target = kcal * CARB_PCT_OF_MEAL - vegKcal - oilKcal;
        } else {
          const carbTarget = kcal * CARB_PCT_OF_MEAL - vegKcal - oilKcal;
          target = kcal - vegKcal - oilKcal - carbTarget;
        }
        target = Math.max(0, target);
        gramsList.push(calculateFoodPortion(kcal100g, target));
      } else if (mealType === "COLAZIONE") {
        const milkKcal = (250 / 100) * 46;
        const fruitKcal = 60;
        const avail = Math.max(0, kcal - milkKcal - fruitKcal);
        gramsList.push(calculateFoodPortion(kcal100g, avail));
      } else {
        // SPUNTINO
        gramsList.push(calculateFoodPortion(kcal100g, kcal));
      }
    }

    return {
      food_id: food.food_id,
      grams_rest: gramsList[0] ?? 0,
      grams_workout1: gramsList[1] ?? null,
      grams_workout2: gramsList[2] ?? null,
    };
  });

  return NextResponse.json(results);
}
