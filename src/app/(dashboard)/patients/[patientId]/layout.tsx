import { notFound } from "next/navigation";
import { ClipboardPenLine, CalendarPlus2, Sparkles } from "lucide-react";
import { requireProfessionalId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { PendingLink } from "@/components/navigation/pending-link";
import { PatientShellNav } from "@/components/patients/patient-shell-nav";
import { Button } from "@/components/ui/button";

function getPatientAge(birthDate: Date | null) {
  if (!birthDate) {
    return null;
  }

  const now = new Date();

  return Math.floor(
    (now.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
}

function getGenderLabel(gender: string | null) {
  if (gender === "F") {
    return "Donna";
  }

  if (gender === "M") {
    return "Uomo";
  }

  return null;
}

export default async function PatientWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ patientId: string }>;
}) {
  const professionalId = await requireProfessionalId();
  const { patientId } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId },
    include: {
      visits: {
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true },
      },
      mealPlans: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { date: true },
      },
    },
  });

  if (!patient) {
    notFound();
  }

  const age = getPatientAge(patient.birthDate);
  const profileSummary = [
    getGenderLabel(patient.gender),
    age !== null ? `${age} anni` : null,
    patient.heightCm ? `${patient.heightCm} cm` : null,
  ]
    .filter(Boolean)
    .join(" - ");

  const activitySummary = [
    patient.visits[0]
      ? `Ultima visita ${patient.visits[0].date.toLocaleDateString("it-IT")}`
      : "Nessuna visita registrata",
    patient.mealPlans[0]
      ? `Ultimo piano ${patient.mealPlans[0].date.toLocaleDateString("it-IT")}`
      : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const description = [profileSummary, activitySummary].filter(Boolean).join(" | ");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Scheda paziente"
        title={patient.name}
        description={description}
        action={
          <>
            <Button
              variant="outline"
              render={
                <PendingLink
                  href={`/patients/${patientId}/edit`}
                  tone="button"
                  pendingLabel={`Apro la modifica di ${patient.name}`}
                />
              }
            >
              <ClipboardPenLine className="size-4" />
              Modifica
            </Button>
            <Button
              variant="outline"
              render={
                <PendingLink
                  href={`/patients/${patientId}/meal-plans/new`}
                  tone="button"
                  pendingLabel={`Apro un nuovo piano per ${patient.name}`}
                />
              }
            >
              <Sparkles className="size-4" />
              Nuovo Piano
            </Button>
            <Button
              render={
                <PendingLink
                  href={`/patients/${patientId}/visits/new`}
                  tone="button"
                  pendingLabel={`Apro una nuova visita per ${patient.name}`}
                />
              }
            >
              <CalendarPlus2 className="size-4" />
              Nuova Visita
            </Button>
          </>
        }
      />

      <PatientShellNav patientId={patientId} />

      <div className="space-y-6">{children}</div>
    </div>
  );
}
