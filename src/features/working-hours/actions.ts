"use server";

import { revalidatePath } from "next/cache";
import { requireProfessionalId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { workingHoursEntrySchema } from "@/validations/working-hours";

export async function upsertWorkingHours(dayOfWeek: number, formData: FormData) {
  const professionalId = await requireProfessionalId();

  const raw = Object.fromEntries(formData);
  const parsed = workingHoursEntrySchema.safeParse({ ...raw, dayOfWeek });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  await prisma.workingHours.upsert({
    where: { professionalId_dayOfWeek: { professionalId, dayOfWeek: data.dayOfWeek } },
    create: {
      professionalId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      slotDuration: data.slotDuration,
      isActive: Boolean(data.isActive),
    },
    update: {
      startTime: data.startTime,
      endTime: data.endTime,
      slotDuration: data.slotDuration,
      isActive: Boolean(data.isActive),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/calendar");
  return { success: true };
}

export async function saveAllWorkingHours(entries: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}[]) {
  const professionalId = await requireProfessionalId();

  await Promise.all(
    entries.map((entry) =>
      prisma.workingHours.upsert({
        where: {
          professionalId_dayOfWeek: { professionalId, dayOfWeek: entry.dayOfWeek },
        },
        create: { professionalId, ...entry },
        update: {
          startTime: entry.startTime,
          endTime: entry.endTime,
          slotDuration: entry.slotDuration,
          isActive: entry.isActive,
        },
      })
    )
  );

  revalidatePath("/settings");
  revalidatePath("/calendar");
  return { success: true };
}
