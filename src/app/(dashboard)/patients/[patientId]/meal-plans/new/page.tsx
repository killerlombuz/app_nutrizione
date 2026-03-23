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
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nuovo Piano Dieta</h1>
        <p className="text-muted-foreground">{patient.name}</p>
      </div>
      <WizardContainer
        patientId={patientId}
        activityLevels={activityLevels}
        sportActivities={sportActivities}
      />
    </div>
  );
}
