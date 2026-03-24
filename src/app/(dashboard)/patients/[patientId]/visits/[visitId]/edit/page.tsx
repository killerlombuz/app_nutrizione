import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { VisitForm } from "@/components/visits/visit-form";
import { updateVisit } from "@/features/visits/actions";

export default async function EditVisitPage({
  params,
}: {
  params: Promise<{ patientId: string; visitId: string }>;
}) {
  const professionalId = await requireProfessionalId();
  const { patientId, visitId } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId },
  });
  if (!patient) notFound();

  const visit = await prisma.visit.findFirst({
    where: { id: visitId, patientId },
  });
  if (!visit) notFound();

  const boundAction = updateVisit.bind(null, patientId, visitId);

  const defaults: Record<string, unknown> = {
    date: visit.date.toISOString().split("T")[0],
    weightKg: visit.weightKg,
    formulaUsed: visit.formulaUsed,
    plicChest: visit.plicChest,
    plicTricep: visit.plicTricep,
    plicAxillary: visit.plicAxillary,
    plicSubscapular: visit.plicSubscapular,
    plicSuprailiac: visit.plicSuprailiac,
    plicAbdominal: visit.plicAbdominal,
    plicThigh: visit.plicThigh,
    circNeck: visit.circNeck,
    circChest: visit.circChest,
    circArmRelaxed: visit.circArmRelaxed,
    circArmFlexed: visit.circArmFlexed,
    circWaist: visit.circWaist,
    circLowerAbdomen: visit.circLowerAbdomen,
    circHips: visit.circHips,
    circUpperThigh: visit.circUpperThigh,
    circMidThigh: visit.circMidThigh,
    circLowerThigh: visit.circLowerThigh,
    circCalf: visit.circCalf,
  };

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
      cancelHref={`/patients/${patientId}`}
      defaultValues={defaults}
      submitLabel="Aggiorna visita"
      title="Modifica Visita"
      description={`Aggiorna i dati raccolti nella visita del ${visit.date.toLocaleDateString("it-IT")}.`}
    />
  );
}
