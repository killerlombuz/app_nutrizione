"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER } from "@/lib/constants";
import type { WizardState } from "./wizard-container";

interface StepSummaryProps {
  state: WizardState;
}

export function StepSummary({ state }: StepSummaryProps) {
  const hasWorkout1 = state.numVariants >= 2;
  const hasWorkout2 = state.numVariants >= 3;
  const orderedMeals = MEAL_TYPE_ORDER.filter((mealType) => state.meals[mealType]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white/[0.78]">
          <CardContent className="py-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Piano
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">{state.name || "-"}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.78]">
          <CardContent className="py-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Kcal riposo
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">{state.totalKcalRest || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.78]">
          <CardContent className="py-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Alimenti totali
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">
              {Object.values(state.meals).reduce((sum, meal) => sum + meal.foods.length, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/[0.78]">
        <CardHeader>
          <CardTitle>Riepilogo piano</CardTitle>
          <CardDescription>Controllo finale di scenari, target proteici e note operative.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.25rem] bg-[var(--surface-low)] p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Data
            </p>
            <p className="mt-2 font-medium">{state.date || "-"}</p>
          </div>
          <div className="rounded-[1.25rem] bg-[var(--surface-low)] p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Proteine
            </p>
            <p className="mt-2 font-medium">
              {state.proteinTargetMin || 0} - {state.proteinTargetMax || 0} g
            </p>
          </div>
          {hasWorkout1 ? (
            <div className="rounded-[1.25rem] bg-[var(--surface-low)] p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {state.workout1Name || "Allenamento 1"}
              </p>
              <p className="mt-2 font-medium">{state.totalKcalWorkout1 || 0} kcal</p>
            </div>
          ) : null}
          {hasWorkout2 ? (
            <div className="rounded-[1.25rem] bg-[var(--surface-low)] p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {state.workout2Name || "Allenamento 2"}
              </p>
              <p className="mt-2 font-medium">{state.totalKcalWorkout2 || 0} kcal</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {state.notes?.trim() ? (
        <Card className="bg-white/[0.78]">
          <CardHeader>
            <CardTitle>Note interne</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">{state.notes}</p>
          </CardContent>
        </Card>
      ) : null}

      {orderedMeals.map((mealType) => {
        const meal = state.meals[mealType];

        return (
          <Card key={mealType} className="bg-white/[0.78]">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                {MEAL_TYPE_LABELS[mealType] || mealType}
                <Badge variant="secondary">{meal.kcalRest} kcal</Badge>
                {hasWorkout1 && meal.kcalWorkout1 !== null ? (
                  <Badge variant="outline">{meal.kcalWorkout1} kcal all. 1</Badge>
                ) : null}
                {hasWorkout2 && meal.kcalWorkout2 !== null ? (
                  <Badge variant="outline">{meal.kcalWorkout2} kcal all. 2</Badge>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meal.foods.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alimento</TableHead>
                      <TableHead>Ruolo</TableHead>
                      <TableHead className="text-right">g riposo</TableHead>
                      {hasWorkout1 ? <TableHead className="text-right">g all. 1</TableHead> : null}
                      {hasWorkout2 ? <TableHead className="text-right">g all. 2</TableHead> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meal.foods.map((food, index) => (
                      <TableRow key={`${food.foodId}-${index}`}>
                        <TableCell>{food.foodName}</TableCell>
                        <TableCell>{food.role}</TableCell>
                        <TableCell className="text-right">{food.gramsRest}</TableCell>
                        {hasWorkout1 ? (
                          <TableCell className="text-right">{food.gramsWorkout1 ?? "-"}</TableCell>
                        ) : null}
                        {hasWorkout2 ? (
                          <TableCell className="text-right">{food.gramsWorkout2 ?? "-"}</TableCell>
                        ) : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">Nessun alimento configurato.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
