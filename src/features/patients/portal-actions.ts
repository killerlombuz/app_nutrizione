"use server";

import { revalidatePath } from "next/cache";
import { requireProfessionalId } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Abilita o disabilita l'accesso al portale per un paziente.
 * Usata dal professionista dalla pagina dettaglio paziente.
 */
export async function togglePatientPortal(patientId: string, enabled: boolean) {
  const professionalId = await requireProfessionalId();

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId },
  });

  if (!patient) return { error: "Paziente non trovato" };

  if (!patient.email && enabled) {
    return { error: "Il paziente deve avere un'email per accedere al portale" };
  }

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      portalEnabled: enabled,
      invitedAt: enabled && !patient.invitedAt ? new Date() : patient.invitedAt,
    },
  });

  revalidatePath(`/patients/${patientId}`);
  return { success: true };
}
