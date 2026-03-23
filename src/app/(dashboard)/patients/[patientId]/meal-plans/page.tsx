import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Piani Dieta</h1>
          <p className="text-muted-foreground">{patient.name}</p>
        </div>
        <Button render={<Link href={`/patients/${patientId}/meal-plans/new`} />}>
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
            <Link
              key={plan.id}
              href={`/patients/${patientId}/meal-plans/${plan.id}`}
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
