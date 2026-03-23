"use server";

import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { settingsSchema } from "@/validations/settings";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const professionalId = await requireProfessionalId();

  const raw = Object.fromEntries(formData);
  const parsed = settingsSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  await prisma.professional.update({
    where: { id: professionalId },
    data: {
      name: d.name,
      title: d.title || null,
      phone: d.phone || null,
      logoUrl: d.logoUrl || null,
    },
  });

  revalidatePath("/settings");
  return { success: true };
}
