"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Gender } from "@/generated/prisma/client";
import { requireProfessionalId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePatientWorkspace } from "@/features/patients/revalidate";
import { patientGoalsSchema } from "@/validations/patient-goals";
import { patientSchema } from "@/validations/patient";

export async function createPatient(formData: FormData) {
  const professionalId = await requireProfessionalId();

  const raw = Object.fromEntries(formData);
  const parsed = patientSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  const patient = await prisma.patient.create({
    data: {
      professionalId,
      name: data.name,
      birthDate: data.birthDate,
      heightCm: data.heightCm ? Number(data.heightCm) : undefined,
      gender: data.gender ? (data.gender as Gender) : undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      notes: data.notes || undefined,
    },
  });

  revalidatePath("/patients");
  revalidatePath("/");
  redirect(`/patients/${patient.id}`);
}

export async function updatePatient(patientId: string, formData: FormData) {
  const professionalId = await requireProfessionalId();

  const raw = Object.fromEntries(formData);
  const parsed = patientSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  await prisma.patient.update({
    where: { id: patientId, professionalId },
    data: {
      name: data.name,
      birthDate: data.birthDate,
      heightCm: data.heightCm ? Number(data.heightCm) : null,
      gender: data.gender ? (data.gender as Gender) : null,
      email: data.email || null,
      phone: data.phone || null,
      notes: data.notes || null,
    },
  });

  revalidatePatientWorkspace(patientId);
  revalidatePath("/patients");
  redirect(`/patients/${patientId}`);
}

export async function deletePatient(patientId: string) {
  const professionalId = await requireProfessionalId();

  await prisma.patient.delete({
    where: { id: patientId, professionalId },
  });

  revalidatePath("/patients");
  revalidatePath("/");
  redirect("/patients");
}

export async function updatePatientGoals(patientId: string, formData: FormData) {
  const professionalId = await requireProfessionalId();

  const raw = Object.fromEntries(formData);
  const parsed = patientGoalsSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  await prisma.patient.update({
    where: { id: patientId, professionalId },
    data: {
      targetWeightKg: data.targetWeightKg ?? null,
      targetBodyFatPct: data.targetBodyFatPct ?? null,
      targetNotes: data.targetNotes?.trim() ? data.targetNotes.trim() : null,
    },
  });

  revalidatePatientWorkspace(patientId);
  revalidatePath("/patients");
  redirect(`/patients/${patientId}`);
}
