"use server";

import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { recipeSchema } from "@/validations/recipe";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createRecipe(data: {
  name: string;
  portions: number | null;
  notes: string;
  ingredients: { foodId?: string; foodName: string; grams: number | null }[];
}) {
  const professionalId = await requireProfessionalId();

  const parsed = recipeSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  // Calculate kcal from ingredients
  let totalKcal = 0;
  const foodIds = d.ingredients
    .map((i) => i.foodId)
    .filter((id): id is string => !!id && id !== "");

  const foods =
    foodIds.length > 0
      ? await prisma.food.findMany({ where: { id: { in: foodIds } } })
      : [];

  const foodMap = new Map(foods.map((f) => [f.id, f]));

  for (const ing of d.ingredients) {
    if (ing.foodId && ing.grams) {
      const food = foodMap.get(ing.foodId);
      if (food) {
        totalKcal += (ing.grams / 100) * food.kcalPer100g;
      }
    }
  }

  const portions = d.portions && d.portions > 0 ? d.portions : 1;

  await prisma.recipe.create({
    data: {
      professionalId,
      name: d.name,
      totalKcal: totalKcal > 0 ? totalKcal : null,
      kcalPerPortion: totalKcal > 0 ? totalKcal / portions : null,
      portions: d.portions,
      notes: d.notes || null,
      ingredients: {
        create: d.ingredients.map((ing, i) => ({
          foodId: ing.foodId && ing.foodId !== "" ? ing.foodId : null,
          foodName: ing.foodName,
          grams: ing.grams,
          sortOrder: i,
        })),
      },
    },
  });

  revalidatePath("/recipes");
  redirect("/recipes");
}

export async function updateRecipe(
  recipeId: string,
  data: {
    name: string;
    portions: number | null;
    notes: string;
    ingredients: { foodId?: string; foodName: string; grams: number | null }[];
  }
) {
  const professionalId = await requireProfessionalId();

  const parsed = recipeSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  let totalKcal = 0;
  const foodIds = d.ingredients
    .map((i) => i.foodId)
    .filter((id): id is string => !!id && id !== "");

  const foods =
    foodIds.length > 0
      ? await prisma.food.findMany({ where: { id: { in: foodIds } } })
      : [];

  const foodMap = new Map(foods.map((f) => [f.id, f]));

  for (const ing of d.ingredients) {
    if (ing.foodId && ing.grams) {
      const food = foodMap.get(ing.foodId);
      if (food) {
        totalKcal += (ing.grams / 100) * food.kcalPer100g;
      }
    }
  }

  const portions = d.portions && d.portions > 0 ? d.portions : 1;

  await prisma.$transaction([
    prisma.recipeIngredient.deleteMany({ where: { recipeId } }),
    prisma.recipe.update({
      where: { id: recipeId, professionalId },
      data: {
        name: d.name,
        totalKcal: totalKcal > 0 ? totalKcal : null,
        kcalPerPortion: totalKcal > 0 ? totalKcal / portions : null,
        portions: d.portions,
        notes: d.notes || null,
        ingredients: {
          create: d.ingredients.map((ing, i) => ({
            foodId: ing.foodId && ing.foodId !== "" ? ing.foodId : null,
            foodName: ing.foodName,
            grams: ing.grams,
            sortOrder: i,
          })),
        },
      },
    }),
  ]);

  revalidatePath("/recipes");
  redirect("/recipes");
}

export async function deleteRecipe(recipeId: string) {
  const professionalId = await requireProfessionalId();

  await prisma.recipe.delete({
    where: { id: recipeId, professionalId },
  });

  revalidatePath("/recipes");
}
