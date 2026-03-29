"use server";

import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { recipeSchema, type RecipeFormValues } from "@/validations/recipe";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function buildRecipeData(data: RecipeFormValues) {
  const portions = data.portions && data.portions > 0 ? data.portions : 1;

  return {
    name: data.name,
    totalKcal: null as number | null,
    kcalPerPortion: null as number | null,
    portions: data.portions,
    notes: data.notes || null,
    imageUrl: data.imageUrl || null,
    prepTimeMin: data.prepTimeMin ?? null,
    cookTimeMin: data.cookTimeMin ?? null,
    difficulty: data.difficulty || null,
    instructions: data.instructions || null,
    isVegetarian: data.isVegetarian,
    isVegan: data.isVegan,
    isGlutenFree: data.isGlutenFree,
    isLactoseFree: data.isLactoseFree,
    isLowFodmap: data.isLowFodmap,
    portionsForKcal: portions,
  };
}

export async function createRecipe(data: RecipeFormValues) {
  const professionalId = await requireProfessionalId();

  const parsed = recipeSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;
  const recipeData = buildRecipeData(d);

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

  await prisma.recipe.create({
    data: {
      professionalId,
      name: recipeData.name,
      totalKcal: totalKcal > 0 ? totalKcal : null,
      kcalPerPortion: totalKcal > 0 ? totalKcal / recipeData.portionsForKcal : null,
      portions: recipeData.portions,
      notes: recipeData.notes,
      imageUrl: recipeData.imageUrl,
      prepTimeMin: recipeData.prepTimeMin,
      cookTimeMin: recipeData.cookTimeMin,
      difficulty: recipeData.difficulty,
      instructions: recipeData.instructions,
      isVegetarian: recipeData.isVegetarian,
      isVegan: recipeData.isVegan,
      isGlutenFree: recipeData.isGlutenFree,
      isLactoseFree: recipeData.isLactoseFree,
      isLowFodmap: recipeData.isLowFodmap,
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
  data: RecipeFormValues
) {
  const professionalId = await requireProfessionalId();

  const parsed = recipeSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;
  const recipeData = buildRecipeData(d);

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

  await prisma.$transaction([
    prisma.recipeIngredient.deleteMany({ where: { recipeId } }),
    prisma.recipe.update({
      where: { id: recipeId, professionalId },
      data: {
        name: recipeData.name,
        totalKcal: totalKcal > 0 ? totalKcal : null,
        kcalPerPortion: totalKcal > 0 ? totalKcal / recipeData.portionsForKcal : null,
        portions: recipeData.portions,
        notes: recipeData.notes,
        imageUrl: recipeData.imageUrl,
        prepTimeMin: recipeData.prepTimeMin,
        cookTimeMin: recipeData.cookTimeMin,
        difficulty: recipeData.difficulty,
        instructions: recipeData.instructions,
        isVegetarian: recipeData.isVegetarian,
        isVegan: recipeData.isVegan,
        isGlutenFree: recipeData.isGlutenFree,
        isLactoseFree: recipeData.isLactoseFree,
        isLowFodmap: recipeData.isLowFodmap,
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
