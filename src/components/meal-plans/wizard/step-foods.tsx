"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MEAL_TYPE_LABELS } from "@/lib/constants";
import { getFoodEmoji } from "@/lib/food-emoji";
import {
  calculateFoodPortion,
  FIXED_VEGETABLES_G,
  FIXED_OIL_ML,
  VEGETABLES_KCAL_100G,
  OIL_KCAL_100G,
  CARB_PCT_OF_MEAL,
} from "@/lib/calculations/meal-planner";
import type { WizardState, WizardFood, WizardMeal } from "./wizard-container";

interface StepFoodsProps {
  state: WizardState;
  updateState: (partial: Partial<WizardState>) => void;
}

interface SearchResult {
  id: string;
  name: string;
  kcalPer100g: number;
  category: string | null;
}

const MEAL_TYPES = [
  "COLAZIONE",
  "SPUNTINO_MATTINA",
  "PRANZO",
  "SPUNTINO_POMERIGGIO",
  "CENA",
  "SPUNTINO_SERA",
];

function getMealKcal(state: WizardState, mealType: string) {
  const pctMap: Record<string, number> = {
    COLAZIONE: state.pctBreakfast,
    SPUNTINO_MATTINA: state.pctSnack1,
    PRANZO: state.pctLunch,
    SPUNTINO_POMERIGGIO: state.pctSnack2,
    CENA: state.pctDinner,
    SPUNTINO_SERA: state.pctSnack3,
  };
  const pct = (pctMap[mealType] ?? 0) / 100;
  return {
    rest: Math.round(state.totalKcalRest * pct),
    w1: state.numVariants >= 2 ? Math.round(state.totalKcalWorkout1 * pct) : null,
    w2: state.numVariants >= 3 ? Math.round(state.totalKcalWorkout2 * pct) : null,
  };
}

function calcGrams(
  mealType: string,
  kcal: number,
  kcal100g: number,
  role: string
): number {
  if (kcal100g <= 0) return 0;

  if (["PRANZO", "CENA"].includes(mealType)) {
    const vegKcal = (FIXED_VEGETABLES_G / 100) * VEGETABLES_KCAL_100G;
    const oilKcal = (FIXED_OIL_ML / 100) * OIL_KCAL_100G;
    if (role === "carb") {
      const target = Math.max(0, kcal * CARB_PCT_OF_MEAL - vegKcal - oilKcal);
      return calculateFoodPortion(kcal100g, target);
    } else {
      const carbTarget = Math.max(0, kcal * CARB_PCT_OF_MEAL - vegKcal - oilKcal);
      const target = Math.max(0, kcal - vegKcal - oilKcal - carbTarget);
      return calculateFoodPortion(kcal100g, target);
    }
  } else if (mealType === "COLAZIONE") {
    const milkKcal = (250 / 100) * 46;
    const fruitKcal = 60;
    return calculateFoodPortion(kcal100g, Math.max(0, kcal - milkKcal - fruitKcal));
  } else {
    return calculateFoodPortion(kcal100g, kcal);
  }
}

export function StepFoods({ state, updateState }: StepFoodsProps) {
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = useState<Record<string, SearchResult[]>>({});

  const searchFoods = useCallback(async (mealType: string, query: string) => {
    setSearchQueries((prev) => ({ ...prev, [mealType]: query }));
    if (query.length < 2) {
      setSearchResults((prev) => ({ ...prev, [mealType]: [] }));
      return;
    }
    const res = await fetch(`/api/foods?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const results = await res.json();
      setSearchResults((prev) => ({ ...prev, [mealType]: results }));
    }
  }, []);

  function addFood(mealType: string, food: SearchResult, role: string = "carb") {
    const kcals = getMealKcal(state, mealType);
    const gramsRest = calcGrams(mealType, kcals.rest, food.kcalPer100g, role);
    const gramsW1 = kcals.w1 !== null ? calcGrams(mealType, kcals.w1, food.kcalPer100g, role) : null;
    const gramsW2 = kcals.w2 !== null ? calcGrams(mealType, kcals.w2, food.kcalPer100g, role) : null;

    const newFood: WizardFood = {
      foodId: food.id,
      foodName: food.name,
      kcalPer100g: food.kcalPer100g,
      gramsRest,
      gramsWorkout1: gramsW1,
      gramsWorkout2: gramsW2,
      isFixed: false,
      role,
    };

    const currentMeal = state.meals[mealType] ?? {
      mealType,
      kcalRest: kcals.rest,
      kcalWorkout1: kcals.w1,
      kcalWorkout2: kcals.w2,
      foods: [],
    };

    updateState({
      meals: {
        ...state.meals,
        [mealType]: {
          ...currentMeal,
          foods: [...currentMeal.foods, newFood],
        },
      },
    });

    setSearchQueries((prev) => ({ ...prev, [mealType]: "" }));
    setSearchResults((prev) => ({ ...prev, [mealType]: [] }));
  }

  function removeFood(mealType: string, foodIdx: number) {
    const currentMeal = state.meals[mealType];
    if (!currentMeal) return;

    updateState({
      meals: {
        ...state.meals,
        [mealType]: {
          ...currentMeal,
          foods: currentMeal.foods.filter((_, i) => i !== foodIdx),
        },
      },
    });
  }

  const activeMeals = MEAL_TYPES.filter((mt) => {
    const pctMap: Record<string, number> = {
      COLAZIONE: state.pctBreakfast,
      SPUNTINO_MATTINA: state.pctSnack1,
      PRANZO: state.pctLunch,
      SPUNTINO_POMERIGGIO: state.pctSnack2,
      CENA: state.pctDinner,
      SPUNTINO_SERA: state.pctSnack3,
    };
    return (pctMap[mt] ?? 0) > 0;
  });

  return (
    <div className="space-y-6">
      {activeMeals.map((mealType) => {
        const kcals = getMealKcal(state, mealType);
        const meal = state.meals[mealType];
        const isMainMeal = ["PRANZO", "CENA"].includes(mealType);

        return (
          <Card key={mealType}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {MEAL_TYPE_LABELS[mealType]}
                <Badge variant="secondary">{kcals.rest} kcal</Badge>
                {kcals.w1 !== null && (
                  <Badge variant="outline" className="text-blue-600">
                    {kcals.w1} kcal
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Foods list */}
              {meal?.foods.map((food, idx) => (
                <div
                  key={`${food.foodId}-${idx}`}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div className="flex items-center gap-2">
                    <span>{getFoodEmoji(food.foodName)}</span>
                    <span className="text-sm font-medium">{food.foodName}</span>
                    {food.isFixed && (
                      <Badge variant="outline" className="text-xs">
                        fisso
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{food.gramsRest}g</span>
                    {food.gramsWorkout1 !== null && (
                      <span className="text-sm text-blue-600">
                        {food.gramsWorkout1}g
                      </span>
                    )}
                    {food.gramsWorkout2 !== null && (
                      <span className="text-sm text-green-600">
                        {food.gramsWorkout2}g
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFood(mealType, idx)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}

              {/* Search */}
              <div className="space-y-2">
                <Input
                  placeholder="Cerca alimento..."
                  value={searchQueries[mealType] ?? ""}
                  onChange={(e) => searchFoods(mealType, e.target.value)}
                />
                {(searchResults[mealType] ?? []).length > 0 && (
                  <div className="max-h-48 overflow-y-auto rounded-lg border">
                    {searchResults[mealType].map((food) => (
                      <div
                        key={food.id}
                        className="flex items-center justify-between border-b p-2 last:border-0"
                      >
                        <span className="text-sm">
                          {getFoodEmoji(food.name, food.category)}{" "}
                          {food.name}{" "}
                          <span className="text-muted-foreground">
                            ({food.kcalPer100g} kcal)
                          </span>
                        </span>
                        <div className="flex gap-1">
                          {isMainMeal ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addFood(mealType, food, "carb")}
                              >
                                Carbo
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addFood(mealType, food, "protein")}
                              >
                                Prot
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addFood(mealType, food, "main")}
                            >
                              Aggiungi
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
