import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { VisitForm } from "@/components/visits/visit-form";
import { createVisit } from "@/features/visits/actions";

export default async function NewVisitPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const professionalId = await requireProfessionalId();
  const { patientId } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId },
  });

  if (!patient) notFound();

  const boundAction = createVisit.bind(null, patientId);

  return (
    <VisitForm
      action={boundAction}
      patient={{
        id: patient.id,
        name: patient.name,
        gender: patient.gender as "M" | "F" | null,
        heightCm: patient.heightCm,
        birthDate: patient.birthDate?.toISOString() ?? null,
      }}
      cancelHref={`/patients/${patientId}/visits`}
      description="Raccogli misure, pliche e circonferenze in un'unica schermata con anteprima dei principali indicatori."
    />
  );
}
