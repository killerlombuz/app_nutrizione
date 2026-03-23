import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { WizardContainer } from "@/components/meal-plans/wizard/wizard-container";
import type { WizardState, WizardMeal } from "@/components/meal-plans/wizard/wizard-container";

export default async function EditMealPlanPage({
  params,
}: {
  params: Promise<{ patientId: string; planId: string }>;
}) {
  const professionalId = await requireProfessionalId();
  const { patientId, planId } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId },
  });
  if (!patient) notFound();

  const plan = await prisma.mealPlan.findUnique({
    where: { id: planId },
    include: {
      mealTemplates: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  if (!plan) notFound();

  const [activityLevels, sportActivities] = await Promise.all([
    prisma.activityLevel.findMany({ orderBy: { bmrMultiplier: "asc" } }),
    prisma.sportActivity.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Convert DB data to wizard state
  const meals: Record<string, WizardMeal> = {};
  for (const template of plan.mealTemplates) {
    meals[template.mealType] = {
      mealType: template.mealType,
      kcalRest: template.kcalRest ?? 0,
      kcalWorkout1: template.kcalWorkout1,
      kcalWorkout2: template.kcalWorkout2,
      foods: template.options.map((opt: typeof template.options[number]) => ({
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

  const initialState: Partial<WizardState> = {
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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modifica Piano Dieta</h1>
        <p className="text-muted-foreground">{patient.name}</p>
      </div>
      <WizardContainer
        patientId={patientId}
        planId={planId}
        activityLevels={activityLevels}
        sportActivities={sportActivities}
        initialState={initialState}
      />
    </div>
  );
}
