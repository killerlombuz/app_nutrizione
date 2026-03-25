import type { WizardMeal, WizardState } from "./wizard-container";

/**
 * Tipo minimo del piano DB necessario per la conversione a WizardState.
 * Compatibile con il risultato di `prisma.mealPlan.findUnique/findFirst`
 * con `include: { mealTemplates: { include: { options: true } } }`.
 */
export interface PlanWithTemplates {
  name: string | null;
  date: Date;
  numVariants: number;
  activityLevelId: string | null;
  totalKcalRest: number | null;
  totalKcalWorkout1: number | null;
  totalKcalWorkout2: number | null;
  proteinTargetMin: number | null;
  proteinTargetMax: number | null;
  workout1Name: string | null;
  workout1Kcal: number | null;
  workout2Name: string | null;
  workout2Kcal: number | null;
  deficitKcal: number | null;
  pctBreakfast: number;
  pctLunch: number;
  pctDinner: number;
  pctSnack1: number;
  pctSnack2: number;
  pctSnack3: number;
  notes: string | null;
  mealTemplates: {
    mealType: string;
    kcalRest: number | null;
    kcalWorkout1: number | null;
    kcalWorkout2: number | null;
    options: {
      foodId: string | null;
      foodName: string | null;
      gramsRest: number | null;
      gramsWorkout1: number | null;
      gramsWorkout2: number | null;
      isFixed: boolean;
      sortOrder: number;
    }[];
  }[];
}

/** Trasforma un piano dal DB in WizardState parziale. */
export function planToWizardState(plan: PlanWithTemplates): Partial<WizardState> {
  const meals: Record<string, WizardMeal> = {};
  for (const template of plan.mealTemplates) {
    meals[template.mealType] = {
      mealType: template.mealType,
      kcalRest: template.kcalRest ?? 0,
      kcalWorkout1: template.kcalWorkout1,
      kcalWorkout2: template.kcalWorkout2,
      foods: template.options.map((opt) => ({
        foodId: opt.foodId ?? "",
        foodName: opt.foodName ?? "",
        kcalPer100g: 0,
        gramsRest: opt.gramsRest ?? 0,
        gramsWorkout1: opt.gramsWorkout1,
        gramsWorkout2: opt.gramsWorkout2,
        isFixed: opt.isFixed,
        role: "carb",
      })),
    };
  }

  return {
    name: plan.name ?? "",
    date: plan.date.toISOString().split("T")[0],
    numVariants: plan.numVariants,
    activityLevelId: plan.activityLevelId ?? "",
    totalKcalRest: plan.totalKcalRest ?? 0,
    totalKcalWorkout1: plan.totalKcalWorkout1 ?? 0,
    totalKcalWorkout2: plan.totalKcalWorkout2 ?? 0,
    proteinTargetMin: plan.proteinTargetMin ?? 0,
    proteinTargetMax: plan.proteinTargetMax ?? 0,
    workout1Name: plan.workout1Name ?? "",
    workout1Kcal: plan.workout1Kcal ?? 0,
    workout2Name: plan.workout2Name ?? "",
    workout2Kcal: plan.workout2Kcal ?? 0,
    deficitKcal: plan.deficitKcal ?? 0,
    pctBreakfast: plan.pctBreakfast * 100,
    pctLunch: plan.pctLunch * 100,
    pctDinner: plan.pctDinner * 100,
    pctSnack1: plan.pctSnack1 * 100,
    pctSnack2: plan.pctSnack2 * 100,
    pctSnack3: plan.pctSnack3 * 100,
    notes: plan.notes ?? "",
    meals,
  };
}
