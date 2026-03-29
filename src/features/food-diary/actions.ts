"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPatient } from "@/lib/supabase/patient-auth";
import { prisma } from "@/lib/db";
import { foodDiarySchema } from "@/validations/food-diary";
import { MealType } from "@/generated/prisma/client";

export async function createDiaryEntry(formData: FormData) {
  const patient = await getCurrentPatient();

  const raw = Object.fromEntries(formData);
  const parsed = foodDiarySchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  await prisma.foodDiary.create({
    data: {
      patientId: patient.id,
      date: new Date(data.date),
      mealType: data.mealType as MealType,
      description: data.description,
      imageUrl: data.imageUrl || null,
      notes: data.notes || null,
    },
  });

  revalidatePath("/portal/diary");
  return { success: true };
}

export async function deleteDiaryEntry(entryId: string) {
  const patient = await getCurrentPatient();

  await prisma.foodDiary.deleteMany({
    where: { id: entryId, patientId: patient.id },
  });

  revalidatePath("/portal/diary");
  return { success: true };
}
