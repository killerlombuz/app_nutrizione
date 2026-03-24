import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { WizardContainer } from "@/components/meal-plans/wizard/wizard-container";

export default async function NewMealPlanPage({
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

  const [activityLevels, sportActivities] = await Promise.all([
    prisma.activityLevel.findMany({ orderBy: { bmrMultiplier: "asc" } }),
    prisma.sportActivity.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <WizardContainer
      patientId={patientId}
      patient={{
        name: patient.name,
        gender: patient.gender as "M" | "F" | null,
        heightCm: patient.heightCm,
        birthDate: patient.birthDate?.toISOString() ?? null,
      }}
      cancelHref={`/patients/${patientId}`}
      activityLevels={activityLevels}
      sportActivities={sportActivities}
    />
  );
}
