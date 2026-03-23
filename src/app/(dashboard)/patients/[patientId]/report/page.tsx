import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { ReportConfig } from "@/components/report/report-config";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const professionalId = await requireProfessionalId();
  const { patientId } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId },
    include: {
      visits: { orderBy: { date: "desc" }, take: 1 },
      mealPlans: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!patient) notFound();

  const lastVisit = patient.visits[0];
  const lastPlan = patient.mealPlans[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Report PDF</h1>
        <p className="text-muted-foreground">{patient.name}</p>
      </div>

      <ReportConfig
        patientId={patientId}
        patientName={patient.name}
        hasVisit={!!lastVisit}
        hasMealPlan={!!lastPlan}
        lastVisitDate={
          lastVisit ? lastVisit.date.toLocaleDateString("it-IT") : null
        }
        lastPlanName={lastPlan ? (lastPlan.name ?? "Piano senza nome") : null}
      />
    </div>
  );
}
