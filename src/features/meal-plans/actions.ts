"use server";

import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { revalidatePatientWorkspace } from "@/features/patients/revalidate";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MealType } from "@/generated/prisma/client";

interface MealOptionInput {
  foodId?: string;
  foodName?: string;
  optionGroup?: string;
  gramsRest?: number;
  gramsWorkout1?: number | null;
  gramsWorkout2?: number | null;
  isFixed?: boolean;
  sortOrder?: number;
}

interface MealInput {
  mealType: string;
  kcalRest?: number;
  kcalWorkout1?: number | null;
  kcalWorkout2?: number | null;
  options: MealOptionInput[];
  weeklyExamples?: {
    dayOfWeek: number;
    carbFood?: string;
    vegetable?: string;
    proteinFood?: string;
  }[];
}

interface MealPlanInput {
  name?: string;
  date?: string;
  activityLevelId?: string;
  numVariants?: number;
  totalKcalRest?: number;
  totalKcalWorkout1?: number | null;
  totalKcalWorkout2?: number | null;
  proteinTargetMin?: number;
  proteinTargetMax?: number;
  workout1Name?: string;
  workout1Kcal?: number;
  workout2Name?: string;
  workout2Kcal?: number;
  deficitKcal?: number;
  pctBreakfast?: number;
  pctLunch?: number;
  pctDinner?: number;
  pctSnack1?: number;
  pctSnack2?: number;
  pctSnack3?: number;
  notes?: string;
  meals: MealInput[];
}

export async function saveMealPlan(patientId: string, data: MealPlanInput) {
  const professionalId = await requireProfessionalId();

  // Verify patient ownership
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId },
  });
  if (!patient) throw new Error("Paziente non trovato");

  const plan = await prisma.mealPlan.create({
    data: {
      patientId,
      name: data.name || null,
      date: data.date ? new Date(data.date) : new Date(),
      activityLevelId: data.activityLevelId || null,
      numVariants: data.numVariants ?? 1,
      totalKcalRest: data.totalKcalRest ?? null,
      totalKcalWorkout1: data.totalKcalWorkout1 ?? null,
      totalKcalWorkout2: data.totalKcalWorkout2 ?? null,
      proteinTargetMin: data.proteinTargetMin ?? null,
      proteinTargetMax: data.proteinTargetMax ?? null,
      workout1Name: data.workout1Name ?? null,
      workout1Kcal: data.workout1Kcal ?? null,
      workout2Name: data.workout2Name ?? null,
      workout2Kcal: data.workout2Kcal ?? null,
      deficitKcal: data.deficitKcal ?? 0,
      pctBreakfast: data.pctBreakfast ?? 0.17,
      pctLunch: data.pctLunch ?? 0.45,
      pctDinner: data.pctDinner ?? 0.25,
      pctSnack1: data.pctSnack1 ?? 0.065,
      pctSnack2: data.pctSnack2 ?? 0.065,
      pctSnack3: data.pctSnack3 ?? 0.0,
      notes: data.notes || null,
      mealTemplates: {
        create: data.meals.map((meal, idx) => ({
          mealType: meal.mealType as MealType,
          sortOrder: idx,
          kcalRest: meal.kcalRest ?? null,
          kcalWorkout1: meal.kcalWorkout1 ?? null,
          kcalWorkout2: meal.kcalWorkout2 ?? null,
          options: {
            create: meal.options.map((opt, optIdx) => ({
              foodId: opt.foodId || null,
              foodName: opt.foodName || null,
              optionGroup: opt.optionGroup || null,
              gramsRest: opt.gramsRest ?? null,
              gramsWorkout1: opt.gramsWorkout1 ?? null,
              gramsWorkout2: opt.gramsWorkout2 ?? null,
              isFixed: opt.isFixed ?? false,
              sortOrder: opt.sortOrder ?? optIdx,
            })),
          },
          weeklyExamples: meal.weeklyExamples
            ? {
                create: meal.weeklyExamples.map((ex) => ({
                  dayOfWeek: ex.dayOfWeek,
                  carbFood: ex.carbFood || null,
                  vegetable: ex.vegetable || null,
                  proteinFood: ex.proteinFood || null,
                })),
              }
            : undefined,
        })),
      },
    },
  });

  revalidatePatientWorkspace(patientId);
  redirect(`/patients/${patientId}/meal-plans/${plan.id}`);
}

export async function updateMealPlan(
  patientId: string,
  planId: string,
  data: MealPlanInput
) {
  const professionalId = await requireProfessionalId();

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId },
  });
  if (!patient) throw new Error("Paziente non trovato");

  // Delete old templates (cascade deletes options and weekly examples)
  await prisma.mealTemplate.deleteMany({ where: { mealPlanId: planId } });

  await prisma.mealPlan.update({
    where: { id: planId },
    data: {
      name: data.name || null,
      date: data.date ? new Date(data.date) : undefined,
      activityLevelId: data.activityLevelId || null,
      numVariants: data.numVariants ?? 1,
      totalKcalRest: data.totalKcalRest ?? null,
      totalKcalWorkout1: data.totalKcalWorkout1 ?? null,
      totalKcalWorkout2: data.totalKcalWorkout2 ?? null,
      proteinTargetMin: data.proteinTargetMin ?? null,
      proteinTargetMax: data.proteinTargetMax ?? null,
      workout1Name: data.workout1Name ?? null,
      workout1Kcal: data.workout1Kcal ?? null,
      workout2Name: data.workout2Name ?? null,
      workout2Kcal: data.workout2Kcal ?? null,
      deficitKcal: data.deficitKcal ?? 0,
      pctBreakfast: data.pctBreakfast ?? 0.17,
      pctLunch: data.pctLunch ?? 0.45,
      pctDinner: data.pctDinner ?? 0.25,
      pctSnack1: data.pctSnack1 ?? 0.065,
      pctSnack2: data.pctSnack2 ?? 0.065,
      pctSnack3: data.pctSnack3 ?? 0.0,
      notes: data.notes || null,
      mealTemplates: {
        create: data.meals.map((meal, idx) => ({
          mealType: meal.mealType as MealType,
          sortOrder: idx,
          kcalRest: meal.kcalRest ?? null,
          kcalWorkout1: meal.kcalWorkout1 ?? null,
          kcalWorkout2: meal.kcalWorkout2 ?? null,
          options: {
            create: meal.options.map((opt, optIdx) => ({
              foodId: opt.foodId || null,
              foodName: opt.foodName || null,
              optionGroup: opt.optionGroup || null,
              gramsRest: opt.gramsRest ?? null,
              gramsWorkout1: opt.gramsWorkout1 ?? null,
              gramsWorkout2: opt.gramsWorkout2 ?? null,
              isFixed: opt.isFixed ?? false,
              sortOrder: opt.sortOrder ?? optIdx,
            })),
          },
          weeklyExamples: meal.weeklyExamples
            ? {
                create: meal.weeklyExamples.map((ex) => ({
                  dayOfWeek: ex.dayOfWeek,
                  carbFood: ex.carbFood || null,
                  vegetable: ex.vegetable || null,
                  proteinFood: ex.proteinFood || null,
                })),
              }
            : undefined,
        })),
      },
    },
  });

  revalidatePatientWorkspace(patientId);
  redirect(`/patients/${patientId}/meal-plans/${planId}`);
}

export async function duplicateMealPlan(patientId: string, planId: string) {
  const professionalId = await requireProfessionalId();

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId },
  });
  if (!patient) throw new Error("Paziente non trovato");

  const original = await prisma.mealPlan.findUnique({
    where: { id: planId },
    include: {
      mealTemplates: {
        include: {
          options: true,
          weeklyExamples: true,
        },
      },
    },
  });

  if (!original) throw new Error("Piano non trovato");

  const newPlan = await prisma.mealPlan.create({
    data: {
      patientId,
      name: `${original.name || "Piano"} (copia)`,
      date: new Date(),
      activityLevelId: original.activityLevelId,
      numVariants: original.numVariants,
      totalKcalRest: original.totalKcalRest,
      totalKcalWorkout1: original.totalKcalWorkout1,
      totalKcalWorkout2: original.totalKcalWorkout2,
      proteinTargetMin: original.proteinTargetMin,
      proteinTargetMax: original.proteinTargetMax,
      workout1Name: original.workout1Name,
      workout1Kcal: original.workout1Kcal,
      workout2Name: original.workout2Name,
      workout2Kcal: original.workout2Kcal,
      deficitKcal: original.deficitKcal,
      pctBreakfast: original.pctBreakfast,
      pctLunch: original.pctLunch,
      pctDinner: original.pctDinner,
      pctSnack1: original.pctSnack1,
      pctSnack2: original.pctSnack2,
      pctSnack3: original.pctSnack3,
      notes: original.notes,
      mealTemplates: {
        create: original.mealTemplates.map((mt: typeof original.mealTemplates[number]) => ({
          mealType: mt.mealType,
          sortOrder: mt.sortOrder,
          kcalRest: mt.kcalRest,
          kcalWorkout1: mt.kcalWorkout1,
          kcalWorkout2: mt.kcalWorkout2,
          notes: mt.notes,
          options: {
            create: mt.options.map((opt: typeof mt.options[number]) => ({
              foodId: opt.foodId,
              foodName: opt.foodName,
              optionGroup: opt.optionGroup,
              gramsRest: opt.gramsRest,
              gramsWorkout1: opt.gramsWorkout1,
              gramsWorkout2: opt.gramsWorkout2,
              isFixed: opt.isFixed,
              sortOrder: opt.sortOrder,
            })),
          },
          weeklyExamples: {
            create: mt.weeklyExamples.map((ex: typeof mt.weeklyExamples[number]) => ({
              dayOfWeek: ex.dayOfWeek,
              carbFood: ex.carbFood,
              vegetable: ex.vegetable,
              proteinFood: ex.proteinFood,
            })),
          },
        })),
      },
    },
  });

  revalidatePatientWorkspace(patientId);
  redirect(`/patients/${patientId}/meal-plans/${newPlan.id}`);
}

export async function regenerateShareToken(
  patientId: string,
  planId: string
) {
  const professionalId = await requireProfessionalId();

  await prisma.patient.findFirstOrThrow({
    where: { id: patientId, professionalId },
  });

  const { createId } = await import("@paralleldrive/cuid2");
  const plan = await prisma.mealPlan.update({
    where: { id: planId },
    data: { shareToken: createId() },
    select: { shareToken: true },
  });

  revalidatePath(`/patients/${patientId}/meal-plans/${planId}`);
  return plan.shareToken;
}

export async function revokeShareToken(patientId: string, planId: string) {
  const professionalId = await requireProfessionalId();

  await prisma.patient.findFirstOrThrow({
    where: { id: patientId, professionalId },
  });

  await prisma.mealPlan.update({
    where: { id: planId },
    data: { shareToken: null },
  });

  revalidatePath(`/patients/${patientId}/meal-plans/${planId}`);
}

export async function deleteMealPlan(patientId: string, planId: string) {
  const professionalId = await requireProfessionalId();

  await prisma.patient.findFirstOrThrow({
    where: { id: patientId, professionalId },
  });

  await prisma.mealPlan.delete({ where: { id: planId } });

  revalidatePatientWorkspace(patientId);
  redirect(`/patients/${patientId}/meal-plans`);
}
