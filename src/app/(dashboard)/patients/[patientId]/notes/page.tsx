import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NoteActions } from "@/components/patients/note-actions";
import { QuickNoteForm } from "@/components/patients/quick-note-form";
import { createPatientNote } from "@/features/patient-notes/actions";
import {
  PATIENT_NOTE_CATEGORY_LABELS,
  sortPatientNotes,
} from "@/features/patients/timeline";

export default async function PatientNotesPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const professionalId = await requireProfessionalId();
  const { patientId } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId },
    include: {
      patientNotes: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  });

  if (!patient) {
    notFound();
  }

  const createNoteAction = createPatientNote.bind(null, patientId);
  const notes = sortPatientNotes(patient.patientNotes);
  const pinnedCount = patient.patientNotes.filter((note) => note.isPinned).length;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-heading text-2xl font-semibold tracking-[-0.04em]">
            Note
          </h2>
          {pinnedCount > 0 && (
            <Badge variant="secondary" className="bg-violet-100 text-violet-700">
              {pinnedCount} in evidenza
            </Badge>
          )}
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          Area dedicata a note cliniche, comunicazioni e follow-up, separata dalla
          panoramica per rendere il lavoro piu leggibile.
        </p>
      </div>

      <Card className="bg-white/[0.78]">
        <CardHeader>
          <CardTitle>Aggiungi nota</CardTitle>
          <CardDescription>
            Cattura rapidamente osservazioni e promemoria senza perdere il contesto
            paziente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuickNoteForm action={createNoteAction} />
        </CardContent>
      </Card>

      <Card className="bg-white/[0.78]">
        <CardHeader>
          <CardTitle>Archivio note</CardTitle>
          <CardDescription>
            Le note con pin restano sempre in alto rispetto alla cronologia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessuna nota disponibile. Aggiungi la prima nota da questa sezione.
            </p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-start justify-between gap-4 rounded-[1.4rem] bg-[var(--surface-low)] px-4 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {note.isPinned && (
                        <Badge
                          variant="secondary"
                          className="bg-violet-100 text-[10px] text-violet-700"
                        >
                          In evidenza
                        </Badge>
                      )}
                      {note.category && (
                        <Badge variant="secondary" className="text-[10px]">
                          {PATIENT_NOTE_CATEGORY_LABELS[note.category] ?? note.category}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground/70">
                        {note.createdAt.toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{note.content}</p>
                  </div>
                  <NoteActions
                    noteId={note.id}
                    patientId={patientId}
                    isPinned={note.isPinned}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
