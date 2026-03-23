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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nuova Visita</h1>
        <p className="text-muted-foreground">{patient.name}</p>
      </div>
      <VisitForm action={boundAction} />
    </div>
  );
}
