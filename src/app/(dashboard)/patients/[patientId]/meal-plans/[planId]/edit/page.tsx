import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { WizardContainer } from "@/components/meal-plans/wizard/wizard-container";
import { planToWizardState } from "@/components/meal-plans/wizard/plan-to-state";

export default async function EditMealPlanPage({
  params,
}: {
  params: Promise<{ patientId: string; planId: string }>;
}) {
  const professionalId = await requireProfessionalId();
  const { patientId, planId } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId },
  });
  if (!patient) notFound();

  const plan = await prisma.mealPlan.findUnique({
    where: { id: planId },
    include: {
      mealTemplates: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  if (!plan) notFound();

  const [activityLevels, sportActivities] = await Promise.all([
    prisma.activityLevel.findMany({ orderBy: { bmrMultiplier: "asc" } }),
    prisma.sportActivity.findMany({ orderBy: { name: "asc" } }),
  ]);

  const initialState = planToWizardState(plan);

  return (
    <WizardContainer
      patientId={patientId}
      planId={planId}
      patient={{
        name: patient.name,
        gender: patient.gender as "M" | "F" | null,
        heightCm: patient.heightCm,
        birthDate: patient.birthDate?.toISOString() ?? null,
      }}
      cancelHref={`/patients/${patientId}/meal-plans/${planId}`}
      title="Modifica Piano Dieta"
      description={`Aggiorna struttura, alimenti e scenari del piano del ${plan.date.toLocaleDateString("it-IT")}.`}
      activityLevels={activityLevels}
      sportActivities={sportActivities}
      initialState={initialState}
    />
  );
}
