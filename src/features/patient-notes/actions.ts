"use server";

import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { revalidatePatientWorkspace } from "@/features/patients/revalidate";
import { patientNoteSchema } from "@/validations/patient-note";

export async function createPatientNote(patientId: string, formData: FormData) {
  const professionalId = await requireProfessionalId();

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId },
    select: { id: true },
  });
  if (!patient) return { error: "Paziente non trovato" };

  const raw = Object.fromEntries(formData);
  const parsed = patientNoteSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.patientNote.create({
    data: {
      patientId,
      content: parsed.data.content,
      category: parsed.data.category || null,
    },
  });

  revalidatePatientWorkspace(patientId);
}

export async function deletePatientNote(noteId: string, patientId: string) {
  const professionalId = await requireProfessionalId();

  const note = await prisma.patientNote.findFirst({
    where: { id: noteId, patient: { professionalId } },
    select: { id: true },
  });
  if (!note) return { error: "Nota non trovata" };

  await prisma.patientNote.delete({ where: { id: noteId } });
  revalidatePatientWorkspace(patientId);
}

export async function toggleNotePin(noteId: string, patientId: string) {
  const professionalId = await requireProfessionalId();

  const note = await prisma.patientNote.findFirst({
    where: { id: noteId, patient: { professionalId } },
    select: { id: true, isPinned: true },
  });
  if (!note) return { error: "Nota non trovata" };

  await prisma.patientNote.update({
    where: { id: noteId },
    data: { isPinned: !note.isPinned },
  });

  revalidatePatientWorkspace(patientId);
}
