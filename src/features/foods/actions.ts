"use server";

import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { foodSchema } from "@/validations/food";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FoodCategory } from "@/generated/prisma/client";

export async function createFood(formData: FormData) {
  const professionalId = await requireProfessionalId();

  const raw = Object.fromEntries(formData);
  const parsed = foodSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  await prisma.food.create({
    data: {
      professionalId,
      name: d.name,
      category: d.category && d.category !== "" ? (d.category as FoodCategory) : null,
      kcalPer100g: d.kcalPer100g,
      fatG: d.fatG,
      satFatG: d.satFatG,
      carbG: d.carbG,
      sugarG: d.sugarG,
      proteinG: d.proteinG,
      fiberG: d.fiberG,
      isFodmap: d.isFodmap,
      isNickel: d.isNickel,
      isGlutenFree: d.isGlutenFree,
      isLactoseFree: d.isLactoseFree,
      notes: d.notes || null,
    },
  });

  revalidatePath("/foods");
  redirect("/foods");
}

export async function updateFood(foodId: string, formData: FormData) {
  const professionalId = await requireProfessionalId();

  const raw = Object.fromEntries(formData);
  const parsed = foodSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  await prisma.food.update({
    where: { id: foodId, professionalId },
    data: {
      name: d.name,
      category: d.category && d.category !== "" ? (d.category as FoodCategory) : null,
      kcalPer100g: d.kcalPer100g,
      fatG: d.fatG,
      satFatG: d.satFatG,
      carbG: d.carbG,
      sugarG: d.sugarG,
      proteinG: d.proteinG,
      fiberG: d.fiberG,
      isFodmap: d.isFodmap,
      isNickel: d.isNickel,
      isGlutenFree: d.isGlutenFree,
      isLactoseFree: d.isLactoseFree,
      notes: d.notes || null,
    },
  });

  revalidatePath("/foods");
  redirect("/foods");
}

export async function deleteFood(foodId: string) {
  const professionalId = await requireProfessionalId();

  await prisma.food.delete({
    where: { id: foodId, professionalId },
  });

  revalidatePath("/foods");
}
