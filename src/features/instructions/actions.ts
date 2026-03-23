"use server";

import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { instructionSchema } from "@/validations/instruction";
import { revalidatePath } from "next/cache";

export async function createInstruction(formData: FormData) {
  const professionalId = await requireProfessionalId();

  const raw = Object.fromEntries(formData);
  const parsed = instructionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  await prisma.dietaryInstruction.create({
    data: {
      professionalId,
      category: d.category,
      title: d.title || null,
      content: d.content || null,
      sortOrder: d.sortOrder,
    },
  });

  revalidatePath("/instructions");
}

export async function updateInstruction(instructionId: string, formData: FormData) {
  const professionalId = await requireProfessionalId();

  const raw = Object.fromEntries(formData);
  const parsed = instructionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  await prisma.dietaryInstruction.update({
    where: { id: instructionId, professionalId },
    data: {
      category: d.category,
      title: d.title || null,
      content: d.content || null,
      sortOrder: d.sortOrder,
    },
  });

  revalidatePath("/instructions");
}

export async function deleteInstruction(instructionId: string) {
  const professionalId = await requireProfessionalId();

  await prisma.dietaryInstruction.delete({
    where: { id: instructionId, professionalId },
  });

  revalidatePath("/instructions");
}
