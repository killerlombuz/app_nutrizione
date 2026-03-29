import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientTimeline } from "@/components/patients/patient-timeline";
import { QuickNoteForm } from "@/components/patients/quick-note-form";
import { createPatientNote } from "@/features/patient-notes/actions";
import { buildPatientTimelineEvents } from "@/features/patients/timeline";

export default async function PatientTimelinePage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const professionalId = await requireProfessionalId();
  const { patientId } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId },
    include: {
      visits: { orderBy: { date: "desc" }, take: 40 },
      mealPlans: { orderBy: { createdAt: "desc" }, take: 20 },
      patientNotes: { orderBy: { createdAt: "desc" }, take: 60 },
      supplements: {
        include: { supplement: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });

  if (!patient) {
    notFound();
  }

  const createNoteAction = createPatientNote.bind(null, patientId);
  const timelineEvents = buildPatientTimelineEvents({
    patientId,
    visits: patient.visits,
    mealPlans: patient.mealPlans,
    patientNotes: patient.patientNotes,
    supplements: patient.supplements,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-2xl font-semibold tracking-[-0.04em]">
          Timeline
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Cronologia completa di visite, piani, note e integratori, pensata per
          seguire il contesto clinico senza scroll dispersivo.
        </p>
      </div>

      <Card className="bg-white/[0.78]">
        <CardHeader>
          <CardTitle>Aggiungi nota rapida</CardTitle>
          <CardDescription>
            Le note aggiunte qui entrano subito nella cronologia del paziente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuickNoteForm action={createNoteAction} />
        </CardContent>
      </Card>

      <Card className="bg-white/[0.78]">
        <CardHeader>
          <CardTitle>Storia clinica</CardTitle>
          <CardDescription>
            Eventi piu recenti in ordine cronologico, con note in evidenza sempre
            in cima.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PatientTimeline events={timelineEvents} patientId={patientId} />
        </CardContent>
      </Card>
    </div>
  );
}
