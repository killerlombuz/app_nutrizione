import type { FoodCategory } from "@/generated/prisma/client";
import { FOOD_CATEGORIES, MEAL_TYPE_LABELS, MEAL_TYPE_ORDER } from "@/lib/constants";

export type ShoppingScenario = "rest" | "workout1" | "workout2";

export interface ShoppingMealBreakdown {
  mealType: string;
  grams: number;
}

export interface ShoppingItem {
  foodId: string | null;
  foodName: string;
  category: FoodCategory | null;
  totalGrams: number;
  dailyGrams: number;
  meals: string[];
  perMealGrams: ShoppingMealBreakdown[];
}

export interface ShoppingList {
  items: ShoppingItem[];
  planName: string;
  scenario: ShoppingScenario;
  daysCount: number;
}

export interface ShoppingListMealOption {
  foodId: string | null;
  foodName: string | null;
  gramsRest: number | null;
  gramsWorkout1: number | null;
  gramsWorkout2: number | null;
  isFixed: boolean;
  food?: {
    category: FoodCategory | null;
  } | null;
}

export interface ShoppingListMealTemplate {
  mealType: string;
  options: ShoppingListMealOption[];
}

const FOOD_CATEGORY_LABELS = new Map(
  FOOD_CATEGORIES.map((category) => [category.value, category.label])
);
const FOOD_CATEGORY_ORDER = new Map(
  FOOD_CATEGORIES.map((category, index) => [category.value, index])
);

function scenarioGrams(
  option: ShoppingListMealOption,
  scenario: ShoppingScenario
) {
  switch (scenario) {
    case "workout1":
      return option.gramsWorkout1;
    case "workout2":
      return option.gramsWorkout2;
    case "rest":
    default:
      return option.gramsRest;
  }
}

function shoppingItemKey(option: ShoppingListMealOption) {
  if (option.foodId) {
    return `food:${option.foodId}`;
  }

  return `name:${(option.foodName ?? "").trim().toLowerCase()}`;
}

function mealOrder(mealType: string) {
  const index = MEAL_TYPE_ORDER.indexOf(mealType as (typeof MEAL_TYPE_ORDER)[number]);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function getShoppingCategoryLabel(category: FoodCategory | null) {
  if (!category) {
    return "Altro";
  }

  return FOOD_CATEGORY_LABELS.get(category) ?? "Altro";
}

function categoryOrder(category: FoodCategory | null) {
  if (!category) {
    return Number.MAX_SAFE_INTEGER;
  }

  return FOOD_CATEGORY_ORDER.get(category) ?? Number.MAX_SAFE_INTEGER;
}

export function getShoppingScenarioLabel(
  scenario: ShoppingScenario,
  workout1Name?: string | null,
  workout2Name?: string | null
) {
  if (scenario === "workout1") {
    return workout1Name || "Allenamento 1";
  }

  if (scenario === "workout2") {
    return workout2Name || "Allenamento 2";
  }

  return "Riposo";
}

export function generateShoppingList(
  mealTemplates: ShoppingListMealTemplate[],
  scenario: ShoppingScenario,
  daysCount = 7,
  planName = "Piano Dieta"
): ShoppingList {
  const normalizedDays = Number.isFinite(daysCount) ? Math.max(1, Math.round(daysCount)) : 7;
  const itemMap = new Map<
    string,
    {
      foodId: string | null;
      foodName: string;
      category: FoodCategory | null;
      dailyGrams: number;
      totalGrams: number;
      meals: Set<string>;
      perMealGrams: Map<string, number>;
    }
  >();

  for (const mealTemplate of mealTemplates) {
    for (const option of mealTemplate.options) {
      const foodName = option.foodName?.trim();
      const dailyGrams = scenarioGrams(option, scenario);

      if (!foodName || dailyGrams == null || dailyGrams <= 0) {
        continue;
      }

      const key = shoppingItemKey(option);
      const totalGrams = dailyGrams * normalizedDays;
      const entry = itemMap.get(key) ?? {
        foodId: option.foodId,
        foodName,
        category: option.food?.category ?? null,
        dailyGrams: 0,
        totalGrams: 0,
        meals: new Set<string>(),
        perMealGrams: new Map<string, number>(),
      };

      entry.dailyGrams += dailyGrams;
      entry.totalGrams += totalGrams;
      entry.meals.add(mealTemplate.mealType);
      entry.perMealGrams.set(
        mealTemplate.mealType,
        (entry.perMealGrams.get(mealTemplate.mealType) ?? 0) + dailyGrams
      );

      itemMap.set(key, entry);
    }
  }

  const items = Array.from(itemMap.values())
    .map<ShoppingItem>((entry) => ({
      foodId: entry.foodId,
      foodName: entry.foodName,
      category: entry.category,
      dailyGrams: entry.dailyGrams,
      totalGrams: entry.totalGrams,
      meals: Array.from(entry.meals).sort((left, right) => mealOrder(left) - mealOrder(right)),
      perMealGrams: Array.from(entry.perMealGrams.entries())
        .sort(([left], [right]) => mealOrder(left) - mealOrder(right))
        .map(([mealType, grams]) => ({
          mealType,
          grams,
        })),
    }))
    .sort((left, right) => {
      const categoryCompare = categoryOrder(left.category) - categoryOrder(right.category);

      if (categoryCompare !== 0) {
        return categoryCompare;
      }

      return left.foodName.localeCompare(right.foodName, "it");
    });

  return {
    items,
    planName,
    scenario,
    daysCount: normalizedDays,
  };
}

export function shoppingListToText(
  shoppingList: ShoppingList,
  options?: {
    workout1Name?: string | null;
    workout2Name?: string | null;
  }
) {
  const lines = [
    `Lista della spesa - ${shoppingList.planName}`,
    `Scenario: ${getShoppingScenarioLabel(
      shoppingList.scenario,
      options?.workout1Name,
      options?.workout2Name
    )}`,
    `Giorni: ${shoppingList.daysCount}`,
    "",
  ];

  let currentCategory: string | null = null;

  for (const item of shoppingList.items) {
    const category = getShoppingCategoryLabel(item.category);

    if (category !== currentCategory) {
      if (currentCategory !== null) {
        lines.push("");
      }

      lines.push(category.toUpperCase());
      currentCategory = category;
    }

    const breakdown = item.perMealGrams
      .map((entry) => {
        const label = MEAL_TYPE_LABELS[entry.mealType] || entry.mealType;
        return `${label}: ${Math.round(entry.grams)} g/die`;
      })
      .join(", ");

    lines.push(
      `- ${item.foodName}: ${Math.round(item.totalGrams)} g totali (${breakdown})`
    );
  }

  return lines.join("\n");
}
