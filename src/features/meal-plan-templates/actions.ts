"use server";

import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { FoodCategory, MealType } from "@/generated/prisma/enums";

export interface TemplateMealFood {
  foodCategory: string;
  portionType: string;
  isFixed: boolean;
  sortOrder: number;
}

export interface TemplateMeal {
  mealType: string;
  foods: TemplateMealFood[];
}

export interface MealPlanTemplateData {
  id: string;
  name: string;
  description: string | null;
  dietType: string | null;
  professionalId: string | null;
  pctBreakfast: number;
  pctLunch: number;
  pctDinner: number;
  pctSnack1: number;
  pctSnack2: number;
  pctSnack3: number;
  meals: TemplateMeal[];
}

export async function getTemplates(): Promise<MealPlanTemplateData[]> {
  const professionalId = await requireProfessionalId();

  const templates = await prisma.mealPlanTemplate.findMany({
    where: {
      OR: [{ professionalId: null }, { professionalId }],
    },
    orderBy: [{ professionalId: "asc" }, { createdAt: "asc" }],
    include: {
      meals: {
        include: {
          foods: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    dietType: t.dietType,
    professionalId: t.professionalId,
    pctBreakfast: t.pctBreakfast,
    pctLunch: t.pctLunch,
    pctDinner: t.pctDinner,
    pctSnack1: t.pctSnack1,
    pctSnack2: t.pctSnack2,
    pctSnack3: t.pctSnack3,
    meals: t.meals.map((m) => ({
      mealType: m.mealType,
      foods: m.foods.map((f) => ({
        foodCategory: f.foodCategory,
        portionType: f.portionType,
        isFixed: f.isFixed,
        sortOrder: f.sortOrder,
      })),
    })),
  }));
}

function inferPortionType(category: FoodCategory | null): string {
  if (!category) return "main";
  if (["CEREALI", "CEREALI_ELABORATI", "FRUTTA", "FRUTTA_ESSICCATA"].includes(category))
    return "carbs_source";
  if (["CARNE", "PESCE", "UOVA_E_ALBUMI", "LEGUMI_E_PROTEINE_VEGETALI"].includes(category))
    return "protein_source";
  if (["OLI_BURRO_E_CIOCCOLATA", "FRUTTA_SECCA"].includes(category)) return "fat_source";
  if (category === "VERDURA") return "vegetable";
  return "main";
}

export async function saveAsTemplate(
  patientId: string,
  planId: string,
  name: string,
  dietType: string
): Promise<void> {
  const professionalId = await requireProfessionalId();

  const plan = await prisma.mealPlan.findUnique({
    where: { id: planId },
    include: {
      mealTemplates: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
            include: { food: { select: { category: true } } },
          },
        },
      },
    },
  });

  if (!plan) throw new Error("Piano non trovato");

  await prisma.mealPlanTemplate.create({
    data: {
      professionalId,
      name: name.trim(),
      dietType: dietType.trim() || null,
      pctBreakfast: plan.pctBreakfast,
      pctLunch: plan.pctLunch,
      pctDinner: plan.pctDinner,
      pctSnack1: plan.pctSnack1,
      pctSnack2: plan.pctSnack2,
      pctSnack3: plan.pctSnack3,
      meals: {
        create: plan.mealTemplates.map((mt) => ({
          mealType: mt.mealType as MealType,
          foods: {
            create: mt.options
              .filter((opt) => opt.food?.category || opt.foodName)
              .map((opt, idx) => ({
                foodCategory: (opt.food?.category ?? "ALTRO") as FoodCategory,
                portionType: inferPortionType(opt.food?.category ?? null),
                isFixed: opt.isFixed,
                sortOrder: idx,
              })),
          },
        })),
      },
    },
  });

  revalidatePath(`/patients/${patientId}/meal-plans`);
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const professionalId = await requireProfessionalId();

  await prisma.mealPlanTemplate.deleteMany({
    where: { id: templateId, professionalId },
  });
}
