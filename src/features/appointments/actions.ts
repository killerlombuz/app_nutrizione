"use server";

import { revalidatePath } from "next/cache";
import { requireProfessionalId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { appointmentSchema, updateAppointmentStatusSchema } from "@/validations/appointment";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

async function checkOverlap(
  professionalId: string,
  date: Date,
  startTime: string,
  endTime: string,
  excludeId?: string
) {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  const existing = await prisma.appointment.findMany({
    where: {
      professionalId,
      date: {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      },
      ...(excludeId ? { id: { not: excludeId } } : {}),
      status: { not: "cancelled" },
    },
    select: { startTime: true, endTime: true, id: true },
  });

  return existing.some((appt) => {
    const existStart = timeToMinutes(appt.startTime);
    const existEnd = timeToMinutes(appt.endTime);
    return startMin < existEnd && endMin > existStart;
  });
}

export async function createAppointment(formData: FormData) {
  const professionalId = await requireProfessionalId();

  const raw = Object.fromEntries(formData);
  const parsed = appointmentSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  const hasOverlap = await checkOverlap(
    professionalId,
    data.date,
    data.startTime,
    data.endTime
  );

  if (hasOverlap) {
    return { error: { startTime: ["Sovrapposizione con un appuntamento esistente"] } };
  }

  const start = timeToMinutes(data.startTime);
  const end = timeToMinutes(data.endTime);
  const duration = end - start;

  await prisma.appointment.create({
    data: {
      professionalId,
      patientId: data.patientId || null,
      title: data.title || null,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      duration: duration > 0 ? duration : 30,
      status: data.status,
      type: data.type || null,
      notes: data.notes || null,
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/");
  return { success: true };
}

export async function updateAppointment(appointmentId: string, formData: FormData) {
  const professionalId = await requireProfessionalId();

  const raw = Object.fromEntries(formData);
  const parsed = appointmentSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId, professionalId },
  });
  if (!existing) return { error: { _: ["Appuntamento non trovato"] } };

  const hasOverlap = await checkOverlap(
    professionalId,
    data.date,
    data.startTime,
    data.endTime,
    appointmentId
  );

  if (hasOverlap) {
    return { error: { startTime: ["Sovrapposizione con un appuntamento esistente"] } };
  }

  const start = timeToMinutes(data.startTime);
  const end = timeToMinutes(data.endTime);
  const duration = end - start;

  await prisma.appointment.update({
    where: { id: appointmentId, professionalId },
    data: {
      patientId: data.patientId || null,
      title: data.title || null,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      duration: duration > 0 ? duration : 30,
      status: data.status,
      type: data.type || null,
      notes: data.notes || null,
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/");
  return { success: true };
}

export async function updateAppointmentStatus(appointmentId: string, formData: FormData) {
  const professionalId = await requireProfessionalId();

  const raw = Object.fromEntries(formData);
  const parsed = updateAppointmentStatusSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.appointment.update({
    where: { id: appointmentId, professionalId },
    data: { status: parsed.data.status },
  });

  revalidatePath("/calendar");
  revalidatePath("/");
  return { success: true };
}

export async function deleteAppointment(appointmentId: string) {
  const professionalId = await requireProfessionalId();

  await prisma.appointment.delete({
    where: { id: appointmentId, professionalId },
  });

  revalidatePath("/calendar");
  revalidatePath("/");
  return { success: true };
}
