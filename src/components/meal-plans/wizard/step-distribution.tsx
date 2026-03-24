"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { WizardState } from "./wizard-container";

interface StepDistributionProps {
  state: WizardState;
  updateState: (partial: Partial<WizardState>) => void;
}

const MEALS = [
  { key: "pctBreakfast" as const, label: "Colazione" },
  { key: "pctSnack1" as const, label: "Spuntino mattina" },
  { key: "pctLunch" as const, label: "Pranzo" },
  { key: "pctSnack2" as const, label: "Spuntino pomeriggio" },
  { key: "pctDinner" as const, label: "Cena" },
  { key: "pctSnack3" as const, label: "Spuntino sera" },
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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white/[0.78]">
          <CardContent className="py-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Totale
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">{totalPct.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.78]">
          <CardContent className="py-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Stato
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">
              {isValid ? "OK" : "Rivedi"}
            </p>
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
      </div>

      <Card className="bg-white/[0.78]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            Distribuzione pasti
            <Badge variant={isValid ? "default" : "destructive"}>{totalPct.toFixed(1)}%</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {MEALS.map((meal) => {
            const pct = state[meal.key];
            const kcalRest = Math.round((pct / 100) * state.totalKcalRest);
            const kcalWorkout1 =
              state.numVariants >= 2 ? Math.round((pct / 100) * state.totalKcalWorkout1) : null;
            const kcalWorkout2 =
              state.numVariants >= 3 ? Math.round((pct / 100) * state.totalKcalWorkout2) : null;

            return (
              <div
                key={meal.key}
                className="rounded-[1.5rem] bg-[var(--surface-low)] px-4 py-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <p className="font-heading text-lg font-semibold tracking-[-0.02em]">
                        {meal.label}
                      </p>
                      <Badge variant="outline">{pct.toFixed(1)}%</Badge>
                    </div>
                    <div className="h-2 w-full max-w-xl rounded-full bg-white">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[110px_auto] md:items-center">
                    <div className="space-y-2">
                      <Label>Percentuale</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={pct}
                        onChange={(event) =>
                          updateState({ [meal.key]: Number(event.target.value) } as Partial<WizardState>)
                        }
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{kcalRest} kcal</Badge>
                      {kcalWorkout1 !== null ? (
                        <Badge variant="outline">{kcalWorkout1} kcal all. 1</Badge>
                      ) : null}
                      {kcalWorkout2 !== null ? (
                        <Badge variant="outline">{kcalWorkout2} kcal all. 2</Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {!isValid ? (
            <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              La somma delle percentuali deve essere 100%. Valore attuale: {totalPct.toFixed(1)}%.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
