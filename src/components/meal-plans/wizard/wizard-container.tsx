"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Save, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StepDistribution } from "./step-distribution";
import { StepFoods } from "./step-foods";
import { StepInfo } from "./step-info";
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
  role: string;
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
  patient: {
    name: string;
    gender?: "M" | "F" | null;
    heightCm?: number | null;
    birthDate?: string | null;
  };
  cancelHref: string;
  planId?: string;
  title?: string;
  description?: string;
  activityLevels: { id: string; name: string; bmrMultiplier: number }[];
  sportActivities: { id: string; name: string; kcalPerHourPerKg: number; defaultDurationMin: number }[];
  initialState?: Partial<WizardState>;
}

const STEP_META = [
  { title: "Info & kcal", summary: "Imposta nome piano, data, varianti e scenari calorici." },
  { title: "Distribuzione", summary: "Ripartisci le calorie sui pasti e verifica il totale." },
  { title: "Alimenti", summary: "Assegna alimenti e porzioni ai pasti attivi del piano." },
  { title: "Riepilogo", summary: "Controlla struttura finale prima del salvataggio." },
] as const;

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

function calculateAge(birthDate?: string | null) {
  if (!birthDate) return null;
  const now = new Date();
  const birth = new Date(birthDate);
  return Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export function WizardContainer({
  patientId,
  patient,
  cancelHref,
  planId,
  title = "Wizard Piano Dieta",
  description = "Costruisci il piano alimentare per scenari, distribuzione e selezione alimenti mantenendo una vista unica sul paziente.",
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

  const updateState = useCallback((partial: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const patientAge = useMemo(() => calculateAge(patient.birthDate), [patient.birthDate]);
  const activeMealCount = useMemo(
    () =>
      [
        state.pctBreakfast,
        state.pctSnack1,
        state.pctLunch,
        state.pctSnack2,
        state.pctDinner,
        state.pctSnack3,
      ].filter((value) => value > 0).length,
    [
      state.pctBreakfast,
      state.pctDinner,
      state.pctLunch,
      state.pctSnack1,
      state.pctSnack2,
      state.pctSnack3,
    ]
  );
  const configuredMeals = useMemo(
    () => Object.values(state.meals).filter((meal) => meal.foods.length > 0).length,
    [state.meals]
  );
  const totalFoods = useMemo(
    () => Object.values(state.meals).reduce((count, meal) => count + meal.foods.length, 0),
    [state.meals]
  );
  const totalDistribution = useMemo(
    () =>
      state.pctBreakfast +
      state.pctSnack1 +
      state.pctLunch +
      state.pctSnack2 +
      state.pctDinner +
      state.pctSnack3,
    [
      state.pctBreakfast,
      state.pctDinner,
      state.pctLunch,
      state.pctSnack1,
      state.pctSnack2,
      state.pctSnack3,
    ]
  );

  async function handleSave() {
    setSaving(true);

    const mealsArray = Object.entries(state.meals).map(([mealType, meal]) => ({
      mealType,
      kcalRest: meal.kcalRest,
      kcalWorkout1: state.numVariants >= 2 ? meal.kcalWorkout1 : null,
      kcalWorkout2: state.numVariants >= 3 ? meal.kcalWorkout2 : null,
      options: meal.foods.map((food, idx) => ({
        foodId: food.foodId,
        foodName: food.foodName,
        gramsRest: food.gramsRest,
        gramsWorkout1: state.numVariants >= 2 ? food.gramsWorkout1 : null,
        gramsWorkout2: state.numVariants >= 3 ? food.gramsWorkout2 : null,
        isFixed: food.isFixed,
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
      return;
    }

    await saveMealPlan(patientId, payload);
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-[2rem] bg-white/[0.72] px-6 py-6 shadow-[var(--shadow-soft)] ring-1 ring-black/5 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary">
            Clinical meal planner
          </p>
          <div className="space-y-1">
            <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em]">
              {title} - {patient.name}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" render={<Link href={cancelHref} />}>
            <X className="size-4" />
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="size-4" />
            {saving ? "Salvataggio..." : planId ? "Aggiorna piano" : "Salva piano"}
          </Button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-[1.9rem] bg-white/[0.75] p-4 shadow-[var(--shadow-soft)] ring-1 ring-black/5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {STEP_META.map((item, index) => {
              const isActive = index === step;
              const isCompleted = index < step;

              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setStep(index)}
                  className={[
                    "rounded-[1.5rem] border px-4 py-4 text-left transition-all duration-200",
                    isActive
                      ? "border-primary/20 bg-[var(--surface-low)] shadow-[var(--shadow-soft)]"
                      : isCompleted
                        ? "border-emerald-200 bg-emerald-50/80"
                        : "border-transparent bg-transparent hover:bg-[var(--surface-low)]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={isActive ? "default" : isCompleted ? "secondary" : "outline"}>
                      Step {index + 1}
                    </Badge>
                    {isActive ? <Sparkles className="size-4 text-primary" /> : null}
                  </div>
                  <p className="mt-4 font-heading text-lg font-semibold tracking-[-0.03em]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>
                </button>
              );
            })}
          </div>
        </div>

        <Card className="bg-[linear-gradient(180deg,rgba(18,24,26,0.95),rgba(30,37,39,0.98))] text-white">
          <CardHeader>
            <CardTitle>Quadro rapido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-1">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/55">
                Paziente
              </p>
              <p className="font-heading text-2xl font-semibold">{patient.name}</p>
              <p className="text-white/65">
                {[
                  patient.gender === "F" ? "Donna" : patient.gender === "M" ? "Uomo" : null,
                  patientAge !== null ? `${patientAge} anni` : null,
                  patient.heightCm ? `${patient.heightCm} cm` : null,
                ]
                  .filter(Boolean)
                  .join(" - ") || "Dati anagrafici parziali"}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[1.25rem] bg-white/10 p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/55">
                  Varianti
                </p>
                <p className="mt-2 font-heading text-2xl font-semibold">{state.numVariants}</p>
              </div>
              <div className="rounded-[1.25rem] bg-white/10 p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/55">
                  Pasti attivi
                </p>
                <p className="mt-2 font-heading text-2xl font-semibold">{activeMealCount}</p>
              </div>
              <div className="rounded-[1.25rem] bg-white/10 p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/55">
                  Pasti configurati
                </p>
                <p className="mt-2 font-heading text-2xl font-semibold">{configuredMeals}</p>
              </div>
              <div className="rounded-[1.25rem] bg-white/10 p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/55">
                  Alimenti selezionati
                </p>
                <p className="mt-2 font-heading text-2xl font-semibold">{totalFoods}</p>
              </div>
            </div>
            <div className="rounded-[1.25rem] bg-white/10 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Distribuzione totale</span>
                <span>{totalDistribution.toFixed(1)}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, totalDistribution))}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/[0.78]">
        <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Step corrente
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.03em]">
              {STEP_META[step].title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {STEP_META[step].summary}
            </p>
          </div>
          <Badge variant="outline">
            {step + 1} / {STEP_META.length}
          </Badge>
        </CardContent>
      </Card>

      {step === 0 && (
        <StepInfo
          state={state}
          updateState={updateState}
          patientId={patientId}
          activityLevels={activityLevels}
          sportActivities={sportActivities}
        />
      )}
      {step === 1 && <StepDistribution state={state} updateState={updateState} />}
      {step === 2 && <StepFoods state={state} updateState={updateState} />}
      {step === 3 && <StepSummary state={state} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0}
        >
          <ChevronLeft className="size-4" />
          Indietro
        </Button>
        {step < STEP_META.length - 1 ? (
          <Button onClick={() => setStep((current) => current + 1)}>
            Avanti
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={saving}>
            <Save className="size-4" />
            {saving ? "Salvataggio..." : planId ? "Aggiorna piano" : "Salva piano"}
          </Button>
        )}
      </div>
    </div>
  );
}
