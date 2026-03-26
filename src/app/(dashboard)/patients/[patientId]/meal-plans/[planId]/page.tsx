import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MEAL_TYPE_LABELS } from "@/lib/constants";
import { getFoodEmoji } from "@/lib/food-emoji";
import { duplicateMealPlan, deleteMealPlan } from "@/features/meal-plans/actions";
import { PendingLink } from "@/components/navigation/pending-link";

export default async function MealPlanPreviewPage({
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
      activityLevel: true,
      mealTemplates: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: { orderBy: { sortOrder: "asc" } },
          weeklyExamples: { orderBy: { dayOfWeek: "asc" } },
        },
      },
    },
  });

  if (!plan) notFound();

  const hasW1 = plan.numVariants >= 2;
  const hasW2 = plan.numVariants >= 3;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {plan.name || "Piano Dieta"}
          </h1>
          <p className="text-muted-foreground">
            {patient.name} — {plan.date.toLocaleDateString("it-IT")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={
              <PendingLink
                href={`/patients/${patientId}/meal-plans/${planId}/edit`}
                tone="button"
                pendingLabel={`Apro la modifica di ${plan.name || "questo piano"}`}
              />
            }
          >
            Modifica
          </Button>
          <form action={duplicateMealPlan.bind(null, patientId, planId)}>
            <Button type="submit" variant="outline">
              Duplica
            </Button>
          </form>
          <Button
            variant="outline"
            render={
              <PendingLink
                href={`/patients/${patientId}/report`}
                tone="button"
                pendingLabel={`Apro il report di ${patient.name}`}
              />
            }
          >
            PDF
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Kcal Riposo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {plan.totalKcalRest ? Math.round(plan.totalKcalRest) : "—"}
            </p>
          </CardContent>
        </Card>
        {hasW1 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Kcal {plan.workout1Name || "Allenamento 1"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {plan.totalKcalWorkout1
                  ? Math.round(plan.totalKcalWorkout1)
                  : "—"}
              </p>
            </CardContent>
          </Card>
        )}
        {hasW2 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Kcal {plan.workout2Name || "Allenamento 2"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {plan.totalKcalWorkout2
                  ? Math.round(plan.totalKcalWorkout2)
                  : "—"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Meals */}
      {plan.mealTemplates.map((template: typeof plan.mealTemplates[number]) => (
        <Card key={template.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {MEAL_TYPE_LABELS[template.mealType] || template.mealType}
              {template.kcalRest && (
                <Badge variant="secondary">
                  {Math.round(template.kcalRest)} kcal
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {template.options.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nessun alimento configurato.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alimento</TableHead>
                    <TableHead className="text-right">g (riposo)</TableHead>
                    {hasW1 && (
                      <TableHead className="text-right">
                        g ({plan.workout1Name || "all. 1"})
                      </TableHead>
                    )}
                    {hasW2 && (
                      <TableHead className="text-right">
                        g ({plan.workout2Name || "all. 2"})
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {template.options.map((opt: typeof template.options[number]) => (
                    <TableRow key={opt.id}>
                      <TableCell>
                        <span className="mr-2">
                          {getFoodEmoji(opt.foodName ?? "")}
                        </span>
                        {opt.foodName}
                        {opt.isFixed && (
                          <Badge variant="outline" className="ml-2">
                            fisso
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {opt.gramsRest ? Math.round(opt.gramsRest) : "—"}
                      </TableCell>
                      {hasW1 && (
                        <TableCell className="text-right">
                          {opt.gramsWorkout1
                            ? Math.round(opt.gramsWorkout1)
                            : "—"}
                        </TableCell>
                      )}
                      {hasW2 && (
                        <TableCell className="text-right">
                          {opt.gramsWorkout2
                            ? Math.round(opt.gramsWorkout2)
                            : "—"}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Delete */}
      <div className="flex justify-end">
        <form action={deleteMealPlan.bind(null, patientId, planId)}>
          <Button type="submit" variant="destructive" size="sm">
            Elimina Piano
          </Button>
        </form>
      </div>
    </div>
  );
}
