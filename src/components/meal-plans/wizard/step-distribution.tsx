"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WizardState } from "./wizard-container";

interface StepDistributionProps {
  state: WizardState;
  updateState: (partial: Partial<WizardState>) => void;
}

const MEALS = [
  { key: "pctBreakfast" as const, label: "Colazione", mealType: "COLAZIONE" },
  { key: "pctSnack1" as const, label: "Spuntino mattina", mealType: "SPUNTINO_MATTINA" },
  { key: "pctLunch" as const, label: "Pranzo", mealType: "PRANZO" },
  { key: "pctSnack2" as const, label: "Spuntino pomeriggio", mealType: "SPUNTINO_POMERIGGIO" },
  { key: "pctDinner" as const, label: "Cena", mealType: "CENA" },
  { key: "pctSnack3" as const, label: "Spuntino sera", mealType: "SPUNTINO_SERA" },
];

export function StepDistribution({ state, updateState }: StepDistributionProps) {
  const totalPct =
    state.pctBreakfast +
    state.pctSnack1 +
    state.pctLunch +
    state.pctSnack2 +
    state.pctDinner +
    state.pctSnack3;

  const isValid = Math.abs(totalPct - 100) < 0.5;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          Distribuzione Pasti
          <Badge variant={isValid ? "default" : "destructive"}>
            {totalPct.toFixed(1)}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {MEALS.map((meal) => {
            const pct = state[meal.key];
            const kcalRest = Math.round((pct / 100) * state.totalKcalRest);
            const kcalW1 =
              state.numVariants >= 2
                ? Math.round((pct / 100) * state.totalKcalWorkout1)
                : null;
            const kcalW2 =
              state.numVariants >= 3
                ? Math.round((pct / 100) * state.totalKcalWorkout2)
                : null;

            return (
              <div
                key={meal.key}
                className="flex items-center gap-4 rounded-lg border p-3"
              >
                <Label className="w-40 font-medium">{meal.label}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.5"
                    className="w-20"
                    value={pct}
                    onChange={(e) =>
                      updateState({ [meal.key]: Number(e.target.value) })
                    }
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <div className="flex gap-3 text-sm text-muted-foreground">
                  <span>{kcalRest} kcal</span>
                  {kcalW1 !== null && (
                    <span className="text-blue-600">{kcalW1} kcal</span>
                  )}
                  {kcalW2 !== null && (
                    <span className="text-green-600">{kcalW2} kcal</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!isValid && (
          <p className="mt-4 text-sm text-red-600">
            La somma delle percentuali deve essere 100%. Attualmente:{" "}
            {totalPct.toFixed(1)}%
          </p>
        )}
      </CardContent>
    </Card>
  );
}
