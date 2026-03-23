"use server";

import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { supplementSchema, patientSupplementSchema } from "@/validations/supplement";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSupplement(formData: FormData) {
  const professionalId = await requireProfessionalId();

  const raw = Object.fromEntries(formData);
  const parsed = supplementSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  await prisma.supplement.create({
    data: {
      professionalId,
      name: d.name,
      description: d.description || null,
      defaultDosage: d.defaultDosage || null,
      timing: d.timing || null,
    },
  });

  revalidatePath("/supplements");
  redirect("/supplements");
}

export async function updateSupplement(supplementId: string, formData: FormData) {
  const professionalId = await requireProfessionalId();

  const raw = Object.fromEntries(formData);
  const parsed = supplementSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  await prisma.supplement.update({
    where: { id: supplementId, professionalId },
    data: {
      name: d.name,
      description: d.description || null,
      defaultDosage: d.defaultDosage || null,
      timing: d.timing || null,
    },
  });

  revalidatePath("/supplements");
  redirect("/supplements");
}

export async function deleteSupplement(supplementId: string) {
  const professionalId = await requireProfessionalId();

  await prisma.supplement.delete({
    where: { id: supplementId, professionalId },
  });

  revalidatePath("/supplements");
}

export async function assignSupplementToPatient(
  patientId: string,
  formData: FormData,
) {
  await requireProfessionalId();

  const raw = Object.fromEntries(formData);
  const parsed = patientSupplementSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  await prisma.patientSupplement.create({
    data: {
      patientId,
      supplementId: d.supplementId,
      dosage: d.dosage || null,
      timing: d.timing || null,
      notes: d.notes || null,
    },
  });

  revalidatePath(`/patients/${patientId}`);
}

export async function removePatientSupplement(
  patientSupplementId: string,
  patientId: string,
) {
  await requireProfessionalId();

  await prisma.patientSupplement.delete({
    where: { id: patientSupplementId },
  });

  revalidatePath(`/patients/${patientId}`);
}
