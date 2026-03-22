"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

    const res = await fetch(
      `/api/patients/${patientId}/metabolism?${params.toString()}`
    );
    if (res.ok) {
      const data = await res.json();
      const sport1 = sportActivities.find((s) => s.id === sport1Id);
      const sport2 = sportActivities.find((s) => s.id === sport2Id);

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Info Piano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Nome piano</Label>
              <Input
                value={state.name}
                onChange={(e) => updateState({ name: e.target.value })}
                placeholder="Piano alimentare"
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={state.date}
                onChange={(e) => updateState({ date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Varianti</Label>
              <Select
                value={String(state.numVariants)}
                onValueChange={(v) => updateState({ numVariants: parseInt(v ?? "1") })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 (solo riposo)</SelectItem>
                  <SelectItem value="2">2 (+ allenamento 1)</SelectItem>
                  <SelectItem value="3">3 (+ allenamento 2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calcolo Metabolismo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Livello attività</Label>
              <Select
                value={state.activityLevelId}
                onValueChange={(v) => updateState({ activityLevelId: v ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona..." />
                </SelectTrigger>
                <SelectContent>
                  {activityLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name} (×{level.bmrMultiplier})
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
                onChange={(e) =>
                  updateState({ deficitKcal: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Sport 1</Label>
              <Select value={sport1Id} onValueChange={(v) => setSport1Id(v ?? "")}>
                <SelectTrigger>
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
              {sport1Id && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Durata (min)</Label>
                  <Input
                    type="number"
                    className="w-20"
                    value={sport1Duration}
                    onChange={(e) => setSport1Duration(Number(e.target.value))}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Sport 2</Label>
              <Select value={sport2Id} onValueChange={(v) => setSport2Id(v ?? "")}>
                <SelectTrigger>
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
              {sport2Id && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Durata (min)</Label>
                  <Input
                    type="number"
                    className="w-20"
                    value={sport2Duration}
                    onChange={(e) => setSport2Duration(Number(e.target.value))}
                  />
                </div>
              )}
            </div>
          </div>

          <Button onClick={calcFromMeasurements} disabled={loading}>
            {loading ? "Calcolo..." : "Calcola da Misure"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kcal Target</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Kcal Riposo</Label>
              <Input
                type="number"
                value={state.totalKcalRest || ""}
                onChange={(e) =>
                  updateState({ totalKcalRest: Number(e.target.value) })
                }
              />
            </div>
            {state.numVariants >= 2 && (
              <div className="space-y-2">
                <Label>Kcal Allenamento 1</Label>
                <Input
                  type="number"
                  value={state.totalKcalWorkout1 || ""}
                  onChange={(e) =>
                    updateState({ totalKcalWorkout1: Number(e.target.value) })
                  }
                />
              </div>
            )}
            {state.numVariants >= 3 && (
              <div className="space-y-2">
                <Label>Kcal Allenamento 2</Label>
                <Input
                  type="number"
                  value={state.totalKcalWorkout2 || ""}
                  onChange={(e) =>
                    updateState({ totalKcalWorkout2: Number(e.target.value) })
                  }
                />
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Proteine target min (g)</Label>
              <Input
                type="number"
                value={state.proteinTargetMin || ""}
                onChange={(e) =>
                  updateState({ proteinTargetMin: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Proteine target max (g)</Label>
              <Input
                type="number"
                value={state.proteinTargetMax || ""}
                onChange={(e) =>
                  updateState({ proteinTargetMax: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
