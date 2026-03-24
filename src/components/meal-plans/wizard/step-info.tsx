"use client";

import { useMemo, useState } from "react";
import { Activity, Calculator, Dumbbell, Flame, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { WizardState } from "./wizard-container";

interface StepInfoProps {
  state: WizardState;
  updateState: (partial: Partial<WizardState>) => void;
  patientId: string;
  activityLevels: { id: string; name: string; bmrMultiplier: number }[];
  sportActivities: {
    id: string;
    name: string;
    kcalPerHourPerKg: number;
    defaultDurationMin: number;
  }[];
}

export function StepInfo({
  state,
  updateState,
  patientId,
  activityLevels,
  sportActivities,
}: StepInfoProps) {
  const [sport1Id, setSport1Id] = useState("");
  const [sport1Duration, setSport1Duration] = useState(60);
  const [sport2Id, setSport2Id] = useState("");
  const [sport2Duration, setSport2Duration] = useState(60);
  const [loading, setLoading] = useState(false);

  const scenarios = useMemo(
    () => [
      { label: "Riposo", kcal: state.totalKcalRest, tone: "text-foreground" },
      {
        label: state.workout1Name || "Allenamento 1",
        kcal: state.numVariants >= 2 ? state.totalKcalWorkout1 : null,
        tone: "text-cyan-700",
      },
      {
        label: state.workout2Name || "Allenamento 2",
        kcal: state.numVariants >= 3 ? state.totalKcalWorkout2 : null,
        tone: "text-emerald-700",
      },
    ],
    [
      state.numVariants,
      state.totalKcalRest,
      state.totalKcalWorkout1,
      state.totalKcalWorkout2,
      state.workout1Name,
      state.workout2Name,
    ]
  );

  async function calcFromMeasurements() {
    setLoading(true);

    const params = new URLSearchParams();
    if (state.activityLevelId) params.set("activity_level_id", state.activityLevelId);
    if (sport1Id) {
      params.set("sport1_id", sport1Id);
      params.set("sport1_duration", String(sport1Duration));
    }
    if (sport2Id) {
      params.set("sport2_id", sport2Id);
      params.set("sport2_duration", String(sport2Duration));
    }
    if (state.deficitKcal) params.set("deficit", String(state.deficitKcal));

    const res = await fetch(`/api/patients/${patientId}/metabolism?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      const sport1 = sportActivities.find((sport) => sport.id === sport1Id);
      const sport2 = sportActivities.find((sport) => sport.id === sport2Id);

      updateState({
        totalKcalRest: Math.round(data.kcalRest),
        totalKcalWorkout1: Math.round(data.kcalWorkout1),
        totalKcalWorkout2: Math.round(data.kcalWorkout2),
        workout1Name: sport1?.name ?? "",
        workout1Kcal: Math.round(data.sport1Kcal),
        workout2Name: sport2?.name ?? "",
        workout2Kcal: Math.round(data.sport2Kcal),
        numVariants: sport2Id ? 3 : sport1Id ? 2 : 1,
      });
    }

    setLoading(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
      <div className="space-y-6">
        <Card className="bg-white/[0.78]">
          <CardHeader>
            <CardTitle>Struttura piano</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome piano</Label>
              <Input
                value={state.name}
                onChange={(event) => updateState({ name: event.target.value })}
                placeholder="Piano alimentare"
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={state.date}
                onChange={(event) => updateState({ date: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Varianti</Label>
              <Select
                value={String(state.numVariants)}
                onValueChange={(value) => updateState({ numVariants: parseInt(value ?? "1", 10) })}
              >
                <SelectTrigger className="h-11 w-full rounded-2xl bg-white/[0.88] px-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 scenario</SelectItem>
                  <SelectItem value="2">2 scenari</SelectItem>
                  <SelectItem value="3">3 scenari</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Note interne</Label>
              <Textarea
                value={state.notes}
                onChange={(event) => updateState({ notes: event.target.value })}
                placeholder="Obiettivi, vincoli, note operative per il piano."
                className="min-h-28 rounded-[1.5rem] bg-white/[0.88]"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.78]">
          <CardHeader>
            <CardTitle>Calcolo metabolismo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Livello attivita</Label>
                <Select
                  value={state.activityLevelId}
                  onValueChange={(value) => updateState({ activityLevelId: value ?? "" })}
                >
                  <SelectTrigger className="h-11 w-full rounded-2xl bg-white/[0.88] px-4">
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activityLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name} (x{level.bmrMultiplier})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Deficit kcal</Label>
                <Input
                  type="number"
                  value={state.deficitKcal || ""}
                  onChange={(event) => updateState({ deficitKcal: Number(event.target.value) })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] bg-[var(--surface-low)] p-4">
                <div className="flex items-center gap-2">
                  <Dumbbell className="size-4 text-primary" />
                  <p className="font-medium">Sport 1</p>
                </div>
                <div className="mt-4 space-y-3">
                  <Select value={sport1Id} onValueChange={(value) => setSport1Id(value ?? "")}>
                    <SelectTrigger className="h-11 w-full rounded-2xl bg-white px-4">
                      <SelectValue placeholder="Nessuno" />
                    </SelectTrigger>
                    <SelectContent>
                      {sportActivities.map((sport) => (
                        <SelectItem key={sport.id} value={sport.id}>
                          {sport.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {sport1Id ? (
                    <div className="space-y-2">
                      <Label>Durata (min)</Label>
                      <Input
                        type="number"
                        value={sport1Duration}
                        onChange={(event) => setSport1Duration(Number(event.target.value))}
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-[var(--surface-low)] p-4">
                <div className="flex items-center gap-2">
                  <Dumbbell className="size-4 text-primary" />
                  <p className="font-medium">Sport 2</p>
                </div>
                <div className="mt-4 space-y-3">
                  <Select value={sport2Id} onValueChange={(value) => setSport2Id(value ?? "")}>
                    <SelectTrigger className="h-11 w-full rounded-2xl bg-white px-4">
                      <SelectValue placeholder="Nessuno" />
                    </SelectTrigger>
                    <SelectContent>
                      {sportActivities.map((sport) => (
                        <SelectItem key={sport.id} value={sport.id}>
                          {sport.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {sport2Id ? (
                    <div className="space-y-2">
                      <Label>Durata (min)</Label>
                      <Input
                        type="number"
                        value={sport2Duration}
                        onChange={(event) => setSport2Duration(Number(event.target.value))}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <Button onClick={calcFromMeasurements} disabled={loading}>
              <Calculator className="size-4" />
              {loading ? "Calcolo..." : "Calcola da misure"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.78]">
          <CardHeader>
            <CardTitle>Scenari calorici</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Kcal riposo</Label>
                <Input
                  type="number"
                  value={state.totalKcalRest || ""}
                  onChange={(event) => updateState({ totalKcalRest: Number(event.target.value) })}
                />
              </div>
              {state.numVariants >= 2 ? (
                <div className="space-y-2">
                  <Label>Kcal allenamento 1</Label>
                  <Input
                    type="number"
                    value={state.totalKcalWorkout1 || ""}
                    onChange={(event) =>
                      updateState({ totalKcalWorkout1: Number(event.target.value) })
                    }
                  />
                </div>
              ) : null}
              {state.numVariants >= 3 ? (
                <div className="space-y-2">
                  <Label>Kcal allenamento 2</Label>
                  <Input
                    type="number"
                    value={state.totalKcalWorkout2 || ""}
                    onChange={(event) =>
                      updateState({ totalKcalWorkout2: Number(event.target.value) })
                    }
                  />
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Proteine target min (g)</Label>
                <Input
                  type="number"
                  value={state.proteinTargetMin || ""}
                  onChange={(event) =>
                    updateState({ proteinTargetMin: Number(event.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Proteine target max (g)</Label>
                <Input
                  type="number"
                  value={state.proteinTargetMax || ""}
                  onChange={(event) =>
                    updateState({ proteinTargetMax: Number(event.target.value) })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="bg-[linear-gradient(180deg,rgba(18,24,26,0.95),rgba(30,37,39,0.98))] text-white">
          <CardHeader>
            <CardTitle>Output metabolismo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {scenarios.map((scenario) =>
              scenario.kcal !== null ? (
                <div key={scenario.label} className="rounded-[1.25rem] bg-white/10 p-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/55">
                    {scenario.label}
                  </p>
                  <p className={`mt-2 font-heading text-3xl font-semibold ${scenario.tone}`}>
                    {Math.round(scenario.kcal)}
                  </p>
                </div>
              ) : null
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/[0.78]">
          <CardHeader>
            <CardTitle>Segnali rapidi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3 rounded-[1.2rem] bg-[var(--surface-low)] p-4">
              <Activity className="size-4 text-primary" />
              <div>
                <p className="font-medium">Livello di attivita</p>
                <p className="text-muted-foreground">
                  {activityLevels.find((level) => level.id === state.activityLevelId)?.name ||
                    "Non impostato"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[1.2rem] bg-[var(--surface-low)] p-4">
              <Flame className="size-4 text-primary" />
              <div>
                <p className="font-medium">Deficit pianificato</p>
                <p className="text-muted-foreground">
                  {state.deficitKcal ? `${state.deficitKcal} kcal` : "Nessun deficit impostato"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[1.2rem] bg-[var(--surface-low)] p-4">
              <NotebookPen className="size-4 text-primary" />
              <div>
                <p className="font-medium">Note operative</p>
                <p className="text-muted-foreground">
                  {state.notes?.trim() ? "Presenti nel piano" : "Ancora assenti"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
