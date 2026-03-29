import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PendingLink } from "@/components/navigation/pending-link";

export default async function MealPlansPage({
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

  const plans = await prisma.mealPlan.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[1.9rem] bg-white/[0.72] px-6 py-6 shadow-[var(--shadow-soft)] ring-1 ring-black/5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-heading text-2xl font-semibold tracking-[-0.04em]">
            Piani dieta
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Archivio piani del paziente con accesso rapido a creazione, duplicazione
            e condivisione.
          </p>
        </div>
        <Button
          render={
            <PendingLink
              href={`/patients/${patientId}/meal-plans/new`}
              tone="button"
              pendingLabel={`Apro un nuovo piano per ${patient.name}`}
            />
          }
        >
          + Nuovo Piano
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nessun piano dieta.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {plans.map((plan: typeof plans[number]) => (
            <PendingLink
              key={plan.id}
              href={`/patients/${patientId}/meal-plans/${plan.id}`}
              tone="panel"
              pendingLabel={`Apro il piano ${plan.name || "senza nome"}`}
              className="block"
            >
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{plan.name || "Piano senza nome"}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {plan.date.toLocaleDateString("it-IT")}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex gap-6 text-sm text-muted-foreground">
                  {plan.totalKcalRest && (
                    <span>{Math.round(plan.totalKcalRest)} kcal (riposo)</span>
                  )}
                  {plan.totalKcalWorkout1 && (
                    <span>
                      {Math.round(plan.totalKcalWorkout1)} kcal (all. 1)
                    </span>
                  )}
                  <span>
                    {plan.numVariants} variant
                    {plan.numVariants > 1 ? "i" : "e"}
                  </span>
                </CardContent>
              </Card>
            </PendingLink>
          ))}
        </div>
      )}
    </div>
  );
}
