"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MEAL_TYPE_LABELS } from "@/lib/constants";
import { getFoodEmoji } from "@/lib/food-emoji";
import type { WizardState } from "./wizard-container";

interface StepSummaryProps {
  state: WizardState;
}

export function StepSummary({ state }: StepSummaryProps) {
  const hasW1 = state.numVariants >= 2;
  const hasW2 = state.numVariants >= 3;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Riepilogo Piano</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nome</span>
            <span>{state.name || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kcal Riposo</span>
            <span className="font-bold">{state.totalKcalRest}</span>
          </div>
          {hasW1 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Kcal {state.workout1Name || "All. 1"}
              </span>
              <span className="font-bold text-blue-600">
                {state.totalKcalWorkout1}
              </span>
            </div>
          )}
          {hasW2 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Kcal {state.workout2Name || "All. 2"}
              </span>
              <span className="font-bold text-green-600">
                {state.totalKcalWorkout2}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {Object.entries(state.meals).map(([mealType, meal]) => (
        <Card key={mealType}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {MEAL_TYPE_LABELS[mealType] || mealType}
              <Badge variant="secondary">{meal.kcalRest} kcal</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {meal.foods.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun alimento.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alimento</TableHead>
                    <TableHead className="text-right">g (riposo)</TableHead>
                    {hasW1 && (
                      <TableHead className="text-right">g (all. 1)</TableHead>
                    )}
                    {hasW2 && (
                      <TableHead className="text-right">g (all. 2)</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meal.foods.map((food, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {getFoodEmoji(food.foodName)} {food.foodName}
                      </TableCell>
                      <TableCell className="text-right">
                        {food.gramsRest}
                      </TableCell>
                      {hasW1 && (
                        <TableCell className="text-right text-blue-600">
                          {food.gramsWorkout1 ?? "—"}
                        </TableCell>
                      )}
                      {hasW2 && (
                        <TableCell className="text-right text-green-600">
                          {food.gramsWorkout2 ?? "—"}
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
    </div>
  );
}
