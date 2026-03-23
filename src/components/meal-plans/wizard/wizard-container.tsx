"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

import { StepInfo } from "./step-info";
import { StepDistribution } from "./step-distribution";
import { StepFoods } from "./step-foods";
import { StepSummary } from "./step-summary";
import { saveMealPlan, updateMealPlan } from "@/features/meal-plans/actions";

export interface WizardFood {
  foodId: string;
  foodName: string;
  kcalPer100g: number;
  gramsRest: number;
  gramsWorkout1: number | null;
  gramsWorkout2: number | null;
  isFixed: boolean;
  role: string; // "carb" | "protein" | "fixed"
}

export interface WizardMeal {
  mealType: string;
  kcalRest: number;
  kcalWorkout1: number | null;
  kcalWorkout2: number | null;
  foods: WizardFood[];
}

export interface WizardState {
  name: string;
  date: string;
  numVariants: number;
  activityLevelId: string;
  totalKcalRest: number;
  totalKcalWorkout1: number;
  totalKcalWorkout2: number;
  proteinTargetMin: number;
  proteinTargetMax: number;
  workout1Name: string;
  workout1Kcal: number;
  workout2Name: string;
  workout2Kcal: number;
  deficitKcal: number;
  pctBreakfast: number;
  pctLunch: number;
  pctDinner: number;
  pctSnack1: number;
  pctSnack2: number;
  pctSnack3: number;
  meals: Record<string, WizardMeal>;
  notes: string;
}

interface WizardContainerProps {
  patientId: string;
  planId?: string;
  activityLevels: { id: string; name: string; bmrMultiplier: number }[];
  sportActivities: { id: string; name: string; kcalPerHourPerKg: number; defaultDurationMin: number }[];
  initialState?: Partial<WizardState>;
}

const STEPS = ["Info & Kcal", "Distribuzione", "Alimenti", "Riepilogo"];

const DEFAULT_STATE: WizardState = {
  name: "",
  date: new Date().toISOString().split("T")[0],
  numVariants: 1,
  activityLevelId: "",
  totalKcalRest: 0,
  totalKcalWorkout1: 0,
  totalKcalWorkout2: 0,
  proteinTargetMin: 0,
  proteinTargetMax: 0,
  workout1Name: "",
  workout1Kcal: 0,
  workout2Name: "",
  workout2Kcal: 0,
  deficitKcal: 0,
  pctBreakfast: 17,
  pctLunch: 45,
  pctDinner: 25,
  pctSnack1: 6.5,
  pctSnack2: 6.5,
  pctSnack3: 0,
  meals: {},
  notes: "",
};

export function WizardContainer({
  patientId,
  planId,
  activityLevels,
  sportActivities,
  initialState,
}: WizardContainerProps) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>({
    ...DEFAULT_STATE,
    ...initialState,
  });
  const [saving, setSaving] = useState(false);

  function updateState(partial: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...partial }));
  }

  async function handleSave() {
    setSaving(true);

    const mealsArray = Object.entries(state.meals).map(([mealType, meal]) => ({
      mealType,
      kcalRest: meal.kcalRest,
      kcalWorkout1: state.numVariants >= 2 ? meal.kcalWorkout1 : null,
      kcalWorkout2: state.numVariants >= 3 ? meal.kcalWorkout2 : null,
      options: meal.foods.map((f, idx) => ({
        foodId: f.foodId,
        foodName: f.foodName,
        gramsRest: f.gramsRest,
        gramsWorkout1: state.numVariants >= 2 ? f.gramsWorkout1 : null,
        gramsWorkout2: state.numVariants >= 3 ? f.gramsWorkout2 : null,
        isFixed: f.isFixed,
        sortOrder: idx,
      })),
    }));

    const payload = {
      name: state.name,
      date: state.date,
      activityLevelId: state.activityLevelId || undefined,
      numVariants: state.numVariants,
      totalKcalRest: state.totalKcalRest,
      totalKcalWorkout1: state.numVariants >= 2 ? state.totalKcalWorkout1 : null,
      totalKcalWorkout2: state.numVariants >= 3 ? state.totalKcalWorkout2 : null,
      proteinTargetMin: state.proteinTargetMin,
      proteinTargetMax: state.proteinTargetMax,
      workout1Name: state.workout1Name,
      workout1Kcal: state.workout1Kcal,
      workout2Name: state.workout2Name,
      workout2Kcal: state.workout2Kcal,
      deficitKcal: state.deficitKcal,
      pctBreakfast: state.pctBreakfast / 100,
      pctLunch: state.pctLunch / 100,
      pctDinner: state.pctDinner / 100,
      pctSnack1: state.pctSnack1 / 100,
      pctSnack2: state.pctSnack2 / 100,
      pctSnack3: state.pctSnack3 / 100,
      notes: state.notes,
      meals: mealsArray,
    };

    if (planId) {
      await updateMealPlan(patientId, planId, payload);
    } else {
      await saveMealPlan(patientId, payload);
    }
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex gap-2">
        {STEPS.map((label, i) => (
          <button
            key={label}
            onClick={() => setStep(i)}
            className={`flex-1 rounded-lg border p-3 text-center text-sm font-medium transition-colors ${
              i === step
                ? "border-primary bg-primary text-primary-foreground"
                : i < step
                  ? "border-green-300 bg-green-50 text-green-700"
                  : "border-gray-200 text-muted-foreground"
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {/* Step content */}
      {step === 0 && (
        <StepInfo
          state={state}
          updateState={updateState}
          patientId={patientId}
          activityLevels={activityLevels}
          sportActivities={sportActivities}
        />
      )}
      {step === 1 && (
        <StepDistribution state={state} updateState={updateState} />
      )}
      {step === 2 && <StepFoods state={state} updateState={updateState} />}
      {step === 3 && <StepSummary state={state} />}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Indietro
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>Avanti</Button>
        ) : (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvataggio..." : planId ? "Aggiorna Piano" : "Salva Piano"}
          </Button>
        )}
      </div>
    </div>
  );
}
