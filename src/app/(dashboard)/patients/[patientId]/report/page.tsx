import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { ReportGenerator } from "@/components/report/report-generator";

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

  const lastVisitDate = patient.visits[0]
    ? patient.visits[0].date.toLocaleDateString("it-IT")
    : null;

  const lastPlanName = patient.mealPlans[0]
    ? patient.mealPlans[0].name || "Piano senza nome"
    : null;

  return (
    <ReportGenerator
      patientId={patientId}
      patientName={patient.name}
      lastVisitDate={lastVisitDate}
      lastPlanName={lastPlanName}
    />
  );
}
