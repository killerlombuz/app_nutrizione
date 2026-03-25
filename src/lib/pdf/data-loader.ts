/**
 * Carica tutti i dati necessari per il report PDF dal database.
 */

import { prisma } from '@/lib/db';
import type { ReportData, ReportSection } from './types';

export async function loadReportData(
  patientId: string,
  professionalId: string,
  sections?: ReportSection[]
): Promise<ReportData> {
  const needsRecipes = !sections || sections.includes('recipes');
  const needsInstructions = !sections || sections.includes('instructions');
  const needsSupplements = !sections || sections.includes('supplements');

  let professional, patient, visits, mealPlan, patientSupplements, instructions, recipes;
  try {
  [professional, patient, visits, mealPlan, patientSupplements, instructions, recipes] =
    await Promise.all([
      prisma.professional.findUniqueOrThrow({
        where: { id: professionalId },
        select: { name: true, title: true, email: true, phone: true },
      }),
      prisma.patient.findFirstOrThrow({
        where: { id: patientId, professionalId },
        select: { name: true, birthDate: true, gender: true, heightCm: true },
      }),
      prisma.visit.findMany({
        where: { patientId },
        orderBy: { date: 'desc' },
      }),
      prisma.mealPlan.findFirst({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        include: {
          mealTemplates: {
            orderBy: { sortOrder: 'asc' },
            include: {
              options: { orderBy: { sortOrder: 'asc' } },
              weeklyExamples: { orderBy: { dayOfWeek: 'asc' } },
            },
          },
        },
      }),
      needsSupplements
        ? prisma.patientSupplement.findMany({
            where: { patientId },
            include: { supplement: true },
          })
        : Promise.resolve([]),
      needsInstructions
        ? prisma.dietaryInstruction.findMany({
            where: { professionalId },
            orderBy: { sortOrder: 'asc' },
          })
        : Promise.resolve([]),
      needsRecipes
        ? prisma.recipe.findMany({
            where: { professionalId },
            include: {
              ingredients: { orderBy: { sortOrder: 'asc' } },
            },
          })
        : Promise.resolve([]),
    ]);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'P2025') {
      throw new Error('Paziente o professionista non trovato. Verifica che i dati esistano nel sistema.');
    }
    throw error;
  }

  return {
    professional,
    patient: {
      ...patient,
      gender: patient.gender as 'M' | 'F' | null,
    },
    visits: visits.map((v) => ({
      date: v.date,
      weightKg: v.weightKg,
      bmi: v.bmi,
      bodyFatPct: v.bodyFatPct,
      fatMassKg: v.fatMassKg,
      leanMassKg: v.leanMassKg,
      formulaUsed: v.formulaUsed,
      plicChest: v.plicChest,
      plicTricep: v.plicTricep,
      plicAxillary: v.plicAxillary,
      plicSubscapular: v.plicSubscapular,
      plicSuprailiac: v.plicSuprailiac,
      plicAbdominal: v.plicAbdominal,
      plicThigh: v.plicThigh,
      circNeck: v.circNeck,
      circChest: v.circChest,
      circArmRelaxed: v.circArmRelaxed,
      circArmFlexed: v.circArmFlexed,
      circWaist: v.circWaist,
      circLowerAbdomen: v.circLowerAbdomen,
      circHips: v.circHips,
      circUpperThigh: v.circUpperThigh,
      circMidThigh: v.circMidThigh,
      circLowerThigh: v.circLowerThigh,
      circCalf: v.circCalf,
    })),
    mealPlan: mealPlan
      ? {
          name: mealPlan.name,
          date: mealPlan.date,
          numVariants: mealPlan.numVariants,
          totalKcalRest: mealPlan.totalKcalRest,
          totalKcalWorkout1: mealPlan.totalKcalWorkout1,
          totalKcalWorkout2: mealPlan.totalKcalWorkout2,
          workout1Name: mealPlan.workout1Name,
          workout1Kcal: mealPlan.workout1Kcal,
          workout2Name: mealPlan.workout2Name,
          workout2Kcal: mealPlan.workout2Kcal,
          pctBreakfast: mealPlan.pctBreakfast,
          pctLunch: mealPlan.pctLunch,
          pctDinner: mealPlan.pctDinner,
          pctSnack1: mealPlan.pctSnack1,
          pctSnack2: mealPlan.pctSnack2,
          pctSnack3: mealPlan.pctSnack3,
          meals: mealPlan.mealTemplates.map((mt) => ({
            mealType: mt.mealType,
            sortOrder: mt.sortOrder,
            kcalRest: mt.kcalRest,
            kcalWorkout1: mt.kcalWorkout1,
            kcalWorkout2: mt.kcalWorkout2,
            options: mt.options.map((o) => ({
              optionGroup: o.optionGroup,
              foodName: o.foodName,
              gramsRest: o.gramsRest,
              gramsWorkout1: o.gramsWorkout1,
              gramsWorkout2: o.gramsWorkout2,
              isFixed: o.isFixed,
              sortOrder: o.sortOrder,
            })),
            weeklyExamples: mt.weeklyExamples.map((we) => ({
              dayOfWeek: we.dayOfWeek,
              carbFood: we.carbFood,
              vegetable: we.vegetable,
              proteinFood: we.proteinFood,
            })),
          })),
        }
      : null,
    supplements: patientSupplements.map((ps) => ({
      name: ps.supplement.name,
      dosage: ps.dosage || ps.supplement.defaultDosage,
      timing: ps.timing || ps.supplement.timing,
      notes: ps.notes,
    })),
    instructions: instructions.map((i) => ({
      category: i.category,
      title: i.title,
      content: i.content,
      sortOrder: i.sortOrder,
    })),
    recipes: recipes.map((r) => ({
      name: r.name,
      totalKcal: r.totalKcal,
      kcalPerPortion: r.kcalPerPortion,
      portions: r.portions,
      ingredients: r.ingredients.map((ing) => ({
        foodName: ing.foodName,
        grams: ing.grams,
      })),
    })),
  };
}
