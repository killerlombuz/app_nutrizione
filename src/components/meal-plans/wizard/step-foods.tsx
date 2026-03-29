"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER } from "@/lib/constants";
import {
  calculateFoodPortion,
  CARB_PCT_OF_MEAL,
  FIXED_OIL_ML,
  FIXED_VEGETABLES_G,
  OIL_KCAL_100G,
  VEGETABLES_KCAL_100G,
} from "@/lib/calculations/meal-planner";
import type { WizardFood, WizardState } from "./wizard-container";

interface StepFoodsProps {
  state: WizardState;
  updateState: (partial: Partial<WizardState>) => void;
  patientId: string;
  templateMealMap: Record<string, Array<{ category: string; portionType: string }>>;
}

interface SearchResult {
  id: string;
  name: string;
  kcalPer100g: number;
  category: string | null;
}

interface SuggestedFood {
  id: string;
  name: string;
  kcalPer100g: number;
  category: string | null;
  grams: number;
}

type MealType = (typeof MEAL_TYPE_ORDER)[number];

// Categorie default per pasto (usate in assenza di template)
const DEFAULT_MEAL_CATEGORIES: Record<string, Array<{ category: string; portionType: string }>> = {
  COLAZIONE: [
    { category: "CEREALI", portionType: "carbs_source" },
    { category: "LATTICINI_E_SOSTITUTI", portionType: "protein_source" },
  ],
  PRANZO: [
    { category: "CEREALI", portionType: "carbs_source" },
    { category: "CARNE", portionType: "protein_source" },
  ],
  CENA: [
    { category: "CEREALI", portionType: "carbs_source" },
    { category: "PESCE", portionType: "protein_source" },
  ],
  SPUNTINO_MATTINA: [{ category: "FRUTTA", portionType: "main" }],
  SPUNTINO_POMERIGGIO: [{ category: "FRUTTA", portionType: "main" }],
  SPUNTINO_SERA: [{ category: "FRUTTA_SECCA", portionType: "fat_source" }],
};

function portionTypeToRole(portionType: string): string {
  if (portionType === "carbs_source") return "carb";
  if (portionType === "protein_source") return "protein";
  return "main";
}

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
    workout1: state.numVariants >= 2 ? Math.round(state.totalKcalWorkout1 * pct) : null,
    workout2: state.numVariants >= 3 ? Math.round(state.totalKcalWorkout2 * pct) : null,
  };
}

function calcGrams(mealType: string, kcal: number, kcal100g: number, role: string) {
  if (kcal100g <= 0) return 0;

  if (["PRANZO", "CENA"].includes(mealType)) {
    const vegKcal = (FIXED_VEGETABLES_G / 100) * VEGETABLES_KCAL_100G;
    const oilKcal = (FIXED_OIL_ML / 100) * OIL_KCAL_100G;

    if (role === "carb") {
      const target = Math.max(0, kcal * CARB_PCT_OF_MEAL - vegKcal - oilKcal);
      return calculateFoodPortion(kcal100g, target);
    }

    const carbTarget = Math.max(0, kcal * CARB_PCT_OF_MEAL - vegKcal - oilKcal);
    const target = Math.max(0, kcal - vegKcal - oilKcal - carbTarget);
    return calculateFoodPortion(kcal100g, target);
  }

  if (mealType === "COLAZIONE") {
    const milkKcal = (250 / 100) * 46;
    const fruitKcal = 60;
    return calculateFoodPortion(kcal100g, Math.max(0, kcal - milkKcal - fruitKcal));
  }

  return calculateFoodPortion(kcal100g, kcal);
}

function getRoleLabel(role: string) {
  if (role === "carb") return "Carbo";
  if (role === "protein") return "Proteina";
  if (role === "fixed") return "Fisso";
  return "Base";
}

function getPresetNotes(mealType: string) {
  if (["PRANZO", "CENA"].includes(mealType)) {
    return [
      "Verdure fisse da 200 g incluse nel calcolo.",
      "Olio fisso da 10 ml incluso nel calcolo.",
      "Porzioni separate tra quota carbo e quota proteica.",
    ];
  }

  if (mealType === "COLAZIONE") {
    return [
      "Il calcolo considera una base latte da 250 ml.",
      "La quota frutta viene tenuta come base fissa.",
    ];
  }

  return [
    "Gli snack usano la quota energetica diretta del pasto.",
    "Le porzioni vengono calcolate sull'intera disponibilita calorica.",
  ];
}

function getFoodInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function StepFoods({ state, updateState, patientId, templateMealMap }: StepFoodsProps) {
  const [activeMealType, setActiveMealType] = useState<MealType>("PRANZO");
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = useState<Record<string, SearchResult[]>>({});
  // key: `${mealType}-${category}` => SuggestedFood[]
  const [suggestions, setSuggestions] = useState<Record<string, SuggestedFood[]>>({});

  const activeMeals = useMemo(
    () =>
      MEAL_TYPE_ORDER.filter((mealType) => {
        const pctMap: Record<string, number> = {
          COLAZIONE: state.pctBreakfast,
          SPUNTINO_MATTINA: state.pctSnack1,
          PRANZO: state.pctLunch,
          SPUNTINO_POMERIGGIO: state.pctSnack2,
          CENA: state.pctDinner,
          SPUNTINO_SERA: state.pctSnack3,
        };
        return (pctMap[mealType] ?? 0) > 0;
      }),
    [
      state.pctBreakfast,
      state.pctDinner,
      state.pctLunch,
      state.pctSnack1,
      state.pctSnack2,
      state.pctSnack3,
    ]
  );

  const resolvedMealType: MealType | null = activeMeals.includes(activeMealType)
    ? activeMealType
    : (activeMeals[0] ?? null);
  const activeMeal = resolvedMealType ? state.meals[resolvedMealType] : undefined;
  const activeMealKcal = resolvedMealType ? getMealKcal(state, resolvedMealType) : null;
  const activeSearchResults = resolvedMealType ? searchResults[resolvedMealType] ?? [] : [];
  const activeQuery = resolvedMealType ? searchQueries[resolvedMealType] ?? "" : "";
  const activeFoods = useMemo(() => activeMeal?.foods ?? [], [activeMeal]);
  const isMainMeal = resolvedMealType ? ["PRANZO", "CENA"].includes(resolvedMealType) : false;

  // Categorie da suggerire per il pasto attivo
  const activeCategories = resolvedMealType
    ? (templateMealMap[resolvedMealType] ?? DEFAULT_MEAL_CATEGORIES[resolvedMealType] ?? [])
    : [];

  const totalRestGrams = useMemo(
    () => activeFoods.reduce((sum, food) => sum + food.gramsRest, 0),
    [activeFoods]
  );
  const totalWorkout1Grams = useMemo(
    () => activeFoods.reduce((sum, food) => sum + (food.gramsWorkout1 ?? 0), 0),
    [activeFoods]
  );
  const totalWorkout2Grams = useMemo(
    () => activeFoods.reduce((sum, food) => sum + (food.gramsWorkout2 ?? 0), 0),
    [activeFoods]
  );

  // Carica suggerimenti quando cambia il pasto attivo o le kcal
  useEffect(() => {
    if (!resolvedMealType || !activeMealKcal || activeMealKcal.rest <= 0) return;

    const categories = templateMealMap[resolvedMealType] ?? DEFAULT_MEAL_CATEGORIES[resolvedMealType] ?? [];
    if (!categories.length) return;

    for (const { category } of categories) {
      const key = `${resolvedMealType}-${category}`;
      const params = new URLSearchParams({
        category,
        targetKcal: String(activeMealKcal.rest),
        patientId,
      });

      fetch(`/api/foods/suggest?${params.toString()}`)
        .then((r) => r.json())
        .then((data: SuggestedFood[]) => {
          setSuggestions((prev) => ({ ...prev, [key]: data }));
        })
        .catch(() => {/* ignora errori di rete */});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedMealType, activeMealKcal?.rest]);

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

  function addFood(mealType: string, food: SearchResult, role = "carb") {
    const kcals = getMealKcal(state, mealType);
    const gramsRest = calcGrams(mealType, kcals.rest, food.kcalPer100g, role);
    const gramsWorkout1 =
      kcals.workout1 !== null ? calcGrams(mealType, kcals.workout1, food.kcalPer100g, role) : null;
    const gramsWorkout2 =
      kcals.workout2 !== null ? calcGrams(mealType, kcals.workout2, food.kcalPer100g, role) : null;

    const newFood: WizardFood = {
      foodId: food.id,
      foodName: food.name,
      kcalPer100g: food.kcalPer100g,
      gramsRest,
      gramsWorkout1,
      gramsWorkout2,
      isFixed: false,
      role,
    };

    const currentMeal = state.meals[mealType] ?? {
      mealType,
      kcalRest: kcals.rest,
      kcalWorkout1: kcals.workout1,
      kcalWorkout2: kcals.workout2,
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

  function addSuggestedFood(mealType: string, food: SuggestedFood, portionType: string) {
    addFood(mealType, { id: food.id, name: food.name, kcalPer100g: food.kcalPer100g, category: food.category }, portionTypeToRole(portionType));
  }

  function removeFood(mealType: string, foodIdx: number) {
    const currentMeal = state.meals[mealType];
    if (!currentMeal) return;

    updateState({
      meals: {
        ...state.meals,
        [mealType]: {
          ...currentMeal,
          foods: currentMeal.foods.filter((_, index) => index !== foodIdx),
        },
      },
    });
  }

  if (!activeMeals.length) {
    return (
      <Card className="bg-white/[0.78]">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Attiva almeno un pasto nello step distribuzione per iniziare a selezionare gli alimenti.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_300px]">
      <Card className="bg-white/[0.78]">
        <CardHeader>
          <CardTitle>Pasti attivi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeMeals.map((mealType) => {
            const mealKcal = getMealKcal(state, mealType);
            const mealFoods = state.meals[mealType]?.foods.length ?? 0;
            const isActive = mealType === activeMealType;

            return (
              <button
                key={mealType}
                type="button"
                onClick={() => setActiveMealType(mealType)}
                className={[
                  "w-full rounded-[1.35rem] px-4 py-4 text-left transition-all duration-200",
                  isActive
                    ? "bg-[var(--surface-low)] shadow-[var(--shadow-soft)] ring-1 ring-primary/10"
                    : "bg-transparent hover:bg-[var(--surface-low)]",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{MEAL_TYPE_LABELS[mealType]}</p>
                  <Badge variant={isActive ? "default" : "outline"}>{mealFoods}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{mealKcal.rest} kcal</p>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card className="bg-white/[0.78]">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {resolvedMealType ? MEAL_TYPE_LABELS[resolvedMealType] : "Pasto"}
            {activeMealKcal ? <Badge variant="outline">{activeMealKcal.rest} kcal</Badge> : null}
            {activeMealKcal && activeMealKcal.workout1 !== null ? (
              <Badge variant="outline">{activeMealKcal.workout1} kcal all. 1</Badge>
            ) : null}
            {activeMealKcal && activeMealKcal.workout2 !== null ? (
              <Badge variant="outline">{activeMealKcal.workout2} kcal all. 2</Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Sezione Suggeriti */}
          {activeCategories.length > 0 && activeMealKcal && activeMealKcal.rest > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <p className="font-medium">Suggeriti</p>
              </div>
              <div className="space-y-2">
                {activeCategories.map(({ category, portionType }) => {
                  const key = `${resolvedMealType}-${category}`;
                  const items = suggestions[key] ?? [];
                  if (!items.length) return null;

                  return (
                    <div key={key} className="space-y-2">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        {category.replace(/_/g, " ")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {items.map((food) => (
                          <button
                            key={food.id}
                            type="button"
                            onClick={() => resolvedMealType && addSuggestedFood(resolvedMealType, food, portionType)}
                            className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                          >
                            <Plus className="size-3" />
                            {food.name}
                            <span className="text-primary/60 text-xs">({food.grams}g)</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="h-px bg-border/50" />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Alimenti selezionati</p>
              <Badge variant="secondary">{activeFoods.length}</Badge>
            </div>
            {activeFoods.length ? (
              <div className="space-y-3">
                {activeFoods.map((food, index) => (
                  <div
                    key={`${food.foodId}-${index}`}
                    className="flex flex-col gap-4 rounded-[1.4rem] bg-[var(--surface-low)] px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-white font-semibold text-primary">
                        {getFoodInitials(food.foodName)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{food.foodName}</p>
                          <Badge variant="outline">{getRoleLabel(food.role)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{food.kcalPer100g} kcal / 100g</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{food.gramsRest} g</Badge>
                      {food.gramsWorkout1 !== null ? (
                        <Badge variant="outline">{food.gramsWorkout1} g all. 1</Badge>
                      ) : null}
                      {food.gramsWorkout2 !== null ? (
                        <Badge variant="outline">{food.gramsWorkout2} g all. 2</Badge>
                      ) : null}
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => resolvedMealType && removeFood(resolvedMealType, index)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-[var(--surface-low)] px-4 py-10 text-center text-sm text-muted-foreground">
                Nessun alimento associato a questo pasto. Cerca nel database e aggiungi le prime opzioni.
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Search className="size-4 text-primary" />
              <p className="font-medium">Ricerca alimenti</p>
            </div>
            <Input
              placeholder="Cerca alimento..."
              value={activeQuery}
              onChange={(event) => {
                if (resolvedMealType) {
                  searchFoods(resolvedMealType, event.target.value);
                }
              }}
            />

            {activeSearchResults.length ? (
              <div className="space-y-3 rounded-[1.5rem] bg-[var(--surface-low)] p-3">
                {activeSearchResults.map((food) => (
                  <div
                    key={food.id}
                    className="flex flex-col gap-3 rounded-[1.2rem] bg-white px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <p className="font-medium">{food.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {food.kcalPer100g} kcal / 100g
                        {food.category ? ` - ${food.category}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isMainMeal ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolvedMealType && addFood(resolvedMealType, food, "carb")}
                          >
                            <Plus className="size-4" />
                            Carbo
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolvedMealType && addFood(resolvedMealType, food, "protein")}
                          >
                            <Plus className="size-4" />
                            Proteina
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolvedMealType && addFood(resolvedMealType, food, "main")}
                        >
                          <Plus className="size-4" />
                          Aggiungi
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : activeQuery.length >= 2 ? (
              <div className="rounded-[1.25rem] bg-[var(--surface-low)] px-4 py-4 text-sm text-muted-foreground">
                Nessun risultato per la ricerca corrente.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="bg-[linear-gradient(180deg,rgba(18,24,26,0.95),rgba(30,37,39,0.98))] text-white">
          <CardHeader>
            <CardTitle>Riepilogo pasto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-[1.2rem] bg-white/10 p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/55">
                Pasto attivo
              </p>
              <p className="mt-2 font-heading text-2xl font-semibold">
                {resolvedMealType ? MEAL_TYPE_LABELS[resolvedMealType] : "Pasto"}
              </p>
            </div>
            <div className="rounded-[1.2rem] bg-white/10 p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/55">
                Quantita totali
              </p>
              <div className="mt-3 space-y-2 text-white/75">
                <div className="flex items-center justify-between">
                  <span>Riposo</span>
                  <span>{totalRestGrams} g</span>
                </div>
                {state.numVariants >= 2 ? (
                  <div className="flex items-center justify-between">
                    <span>Allenamento 1</span>
                    <span>{totalWorkout1Grams} g</span>
                  </div>
                ) : null}
                {state.numVariants >= 3 ? (
                  <div className="flex items-center justify-between">
                    <span>Allenamento 2</span>
                    <span>{totalWorkout2Grams} g</span>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="rounded-[1.2rem] bg-white/10 p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/55">
                Focus
              </p>
              <p className="mt-2 text-white/75">
                {isMainMeal
                  ? "Bilancia la quota carbo e proteica mantenendo coerenti verdure e olio."
                  : "Definisci un set essenziale di alimenti facili da sostituire nel tempo."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.78]">
          <CardHeader>
            <CardTitle>Preset del pasto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {getPresetNotes(resolvedMealType ?? "PRANZO").map((note) => (
              <div key={note} className="rounded-[1.2rem] bg-[var(--surface-low)] px-4 py-3">
                {note}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white/[0.78]">
          <CardHeader>
            <CardTitle>Composizione corrente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeFoods.length ? (
              activeFoods.map((food, index) => (
                <div
                  key={`${food.foodId}-${index}`}
                  className="flex items-center justify-between rounded-[1.1rem] bg-[var(--surface-low)] px-4 py-3 text-sm"
                >
                  <span className="font-medium">{food.foodName}</span>
                  <Badge variant="outline">{getRoleLabel(food.role)}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Ancora nessun alimento selezionato.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
