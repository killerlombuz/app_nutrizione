import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Report PDF</h1>
      <p className="text-muted-foreground">{patient.name}</p>

      <Card>
        <CardHeader>
          <CardTitle>Genera Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Il report includerà: composizione corporea, piano alimentare,
            esempio settimanale, integratori, indicazioni dietetiche e ricette.
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ultima visita</span>
              <span>
                {patient.visits[0]
                  ? patient.visits[0].date.toLocaleDateString("it-IT")
                  : "Nessuna visita"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ultimo piano</span>
              <span>
                {patient.mealPlans[0]
                  ? patient.mealPlans[0].name || "Piano senza nome"
                  : "Nessun piano"}
              </span>
            </div>
          </div>

          {/* TODO: Implementare generazione PDF con Playwright */}
          <Button disabled className="w-full">
            Genera PDF (in arrivo)
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            La generazione PDF con Playwright sarà implementata nella Fase 7.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
