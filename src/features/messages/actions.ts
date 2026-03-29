"use server";

import { revalidatePath } from "next/cache";
import { requireProfessionalId } from "@/lib/auth";
import { getCurrentPatient } from "@/lib/supabase/patient-auth";
import { prisma } from "@/lib/db";
import { messageSchema } from "@/validations/message";

/**
 * Il paziente invia un messaggio al professionista.
 */
export async function sendMessageAsPatient(formData: FormData) {
  const patient = await getCurrentPatient();

  const raw = Object.fromEntries(formData);
  const parsed = messageSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.message.create({
    data: {
      conversationId: patient.id,
      patientId: patient.id,
      senderId: patient.id,
      senderType: "patient",
      content: parsed.data.content,
    },
  });

  revalidatePath("/portal/messages");
  return { success: true };
}

/**
 * Il professionista invia un messaggio a un paziente.
 */
export async function sendMessageAsProfessional(
  patientId: string,
  formData: FormData
) {
  const professionalId = await requireProfessionalId();

  // Verifica che il paziente appartenga al professionista
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId },
  });

  if (!patient) return { error: "Paziente non trovato" };

  const raw = Object.fromEntries(formData);
  const parsed = messageSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.message.create({
    data: {
      conversationId: patientId,
      patientId,
      senderId: professionalId,
      senderType: "professional",
      content: parsed.data.content,
    },
  });

  revalidatePath(`/messages/${patientId}`);
  revalidatePath("/messages");
  return { success: true };
}

/**
 * Segna come letti tutti i messaggi non letti di una conversazione
 * (chiamata dal professionista alla apertura della chat).
 */
export async function markMessagesRead(
  patientId: string,
  reader: "professional" | "patient"
) {
  if (reader === "professional") {
    await requireProfessionalId();
    await prisma.message.updateMany({
      where: {
        conversationId: patientId,
        senderType: "patient",
        isRead: false,
      },
      data: { isRead: true },
    });
    revalidatePath(`/messages/${patientId}`);
    revalidatePath("/messages");
  } else {
    const patient = await getCurrentPatient();
    await prisma.message.updateMany({
      where: {
        conversationId: patient.id,
        senderType: "professional",
        isRead: false,
      },
      data: { isRead: true },
    });
    revalidatePath("/portal/messages");
  }
}
