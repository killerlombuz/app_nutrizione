"use server";

import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { visitSchema } from "@/validations/visit";
import { calculateBodyComposition, calculateAge } from "@/lib/calculations/body-composition";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Gender } from "@/generated/prisma/client";

function toFloat(val: unknown): number | null {
  if (val === "" || val === undefined || val === null) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

export async function createVisit(patientId: string, formData: FormData) {
  const professionalId = await requireProfessionalId();

  // Verify patient belongs to professional
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId },
  });
  if (!patient) throw new Error("Paziente non trovato");

  const raw = Object.fromEntries(formData);
  const parsed = visitSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  // Calculate body composition if we have enough plica data
  let bmi: number | null = null;
  let bodyFatPct: number | null = null;
  let fatMassKg: number | null = null;
  let leanMassKg: number | null = null;

  const hasPlics =
    toFloat(d.plicChest) != null &&
    toFloat(d.plicTricep) != null &&
    toFloat(d.plicThigh) != null;

  if (hasPlics && patient.heightCm && patient.birthDate && patient.gender) {
    const age = calculateAge(patient.birthDate, new Date(d.date));
    const result = calculateBodyComposition({
      gender: patient.gender as "M" | "F",
      age,
      weightKg: d.weightKg,
      heightCm: patient.heightCm,
      plicChest: toFloat(d.plicChest) ?? 0,
      plicTricep: toFloat(d.plicTricep) ?? 0,
      plicAxillary: toFloat(d.plicAxillary) ?? 0,
      plicSubscapular: toFloat(d.plicSubscapular) ?? 0,
      plicSuprailiac: toFloat(d.plicSuprailiac) ?? 0,
      plicAbdominal: toFloat(d.plicAbdominal) ?? 0,
      plicThigh: toFloat(d.plicThigh) ?? 0,
      formula: d.formulaUsed,
    });

    bmi = result.bmi;
    bodyFatPct = result.bodyFatPct;
    fatMassKg = result.fatMassKg;
    leanMassKg = result.leanMassKg;
  } else if (patient.heightCm && d.weightKg) {
    // At minimum calculate BMI
    const heightM = patient.heightCm / 100;
    bmi = Math.round((d.weightKg / heightM ** 2) * 100) / 100;
  }

  await prisma.visit.create({
    data: {
      patientId,
      date: new Date(d.date),
      weightKg: d.weightKg,
      plicChest: toFloat(d.plicChest),
      plicTricep: toFloat(d.plicTricep),
      plicAxillary: toFloat(d.plicAxillary),
      plicSubscapular: toFloat(d.plicSubscapular),
      plicSuprailiac: toFloat(d.plicSuprailiac),
      plicAbdominal: toFloat(d.plicAbdominal),
      plicThigh: toFloat(d.plicThigh),
      circNeck: toFloat(d.circNeck),
      circChest: toFloat(d.circChest),
      circArmRelaxed: toFloat(d.circArmRelaxed),
      circArmFlexed: toFloat(d.circArmFlexed),
      circWaist: toFloat(d.circWaist),
      circLowerAbdomen: toFloat(d.circLowerAbdomen),
      circHips: toFloat(d.circHips),
      circUpperThigh: toFloat(d.circUpperThigh),
      circMidThigh: toFloat(d.circMidThigh),
      circLowerThigh: toFloat(d.circLowerThigh),
      circCalf: toFloat(d.circCalf),
      bmi,
      bodyFatPct,
      fatMassKg,
      leanMassKg,
      formulaUsed: d.formulaUsed,
    },
  });

  revalidatePath(`/patients/${patientId}`);
  redirect(`/patients/${patientId}`);
}

export async function updateVisit(
  patientId: string,
  visitId: string,
  formData: FormData
) {
  const professionalId = await requireProfessionalId();

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId },
  });
  if (!patient) throw new Error("Paziente non trovato");

  const raw = Object.fromEntries(formData);
  const parsed = visitSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  let bmi: number | null = null;
  let bodyFatPct: number | null = null;
  let fatMassKg: number | null = null;
  let leanMassKg: number | null = null;

  const hasPlics =
    toFloat(d.plicChest) != null &&
    toFloat(d.plicTricep) != null &&
    toFloat(d.plicThigh) != null;

  if (hasPlics && patient.heightCm && patient.birthDate && patient.gender) {
    const age = calculateAge(patient.birthDate, new Date(d.date));
    const result = calculateBodyComposition({
      gender: patient.gender as "M" | "F",
      age,
      weightKg: d.weightKg,
      heightCm: patient.heightCm,
      plicChest: toFloat(d.plicChest) ?? 0,
      plicTricep: toFloat(d.plicTricep) ?? 0,
      plicAxillary: toFloat(d.plicAxillary) ?? 0,
      plicSubscapular: toFloat(d.plicSubscapular) ?? 0,
      plicSuprailiac: toFloat(d.plicSuprailiac) ?? 0,
      plicAbdominal: toFloat(d.plicAbdominal) ?? 0,
      plicThigh: toFloat(d.plicThigh) ?? 0,
      formula: d.formulaUsed,
    });

    bmi = result.bmi;
    bodyFatPct = result.bodyFatPct;
    fatMassKg = result.fatMassKg;
    leanMassKg = result.leanMassKg;
  } else if (patient.heightCm && d.weightKg) {
    const heightM = patient.heightCm / 100;
    bmi = Math.round((d.weightKg / heightM ** 2) * 100) / 100;
  }

  await prisma.visit.update({
    where: { id: visitId },
    data: {
      date: new Date(d.date),
      weightKg: d.weightKg,
      plicChest: toFloat(d.plicChest),
      plicTricep: toFloat(d.plicTricep),
      plicAxillary: toFloat(d.plicAxillary),
      plicSubscapular: toFloat(d.plicSubscapular),
      plicSuprailiac: toFloat(d.plicSuprailiac),
      plicAbdominal: toFloat(d.plicAbdominal),
      plicThigh: toFloat(d.plicThigh),
      circNeck: toFloat(d.circNeck),
      circChest: toFloat(d.circChest),
      circArmRelaxed: toFloat(d.circArmRelaxed),
      circArmFlexed: toFloat(d.circArmFlexed),
      circWaist: toFloat(d.circWaist),
      circLowerAbdomen: toFloat(d.circLowerAbdomen),
      circHips: toFloat(d.circHips),
      circUpperThigh: toFloat(d.circUpperThigh),
      circMidThigh: toFloat(d.circMidThigh),
      circLowerThigh: toFloat(d.circLowerThigh),
      circCalf: toFloat(d.circCalf),
      bmi,
      bodyFatPct,
      fatMassKg,
      leanMassKg,
      formulaUsed: d.formulaUsed,
    },
  });

  revalidatePath(`/patients/${patientId}`);
  redirect(`/patients/${patientId}`);
}
