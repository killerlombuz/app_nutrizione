"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PatientGoalsForm } from "@/components/patients/patient-goals-form";

type ActionResult = { error?: Record<string, string[]> } | void;

type GoalVisit = {
  weightKg?: number | null;
  bodyFatPct?: number | null;
};

export interface PatientGoalsCardProps {
  patientName: string;
  targetWeightKg?: number | null;
  targetBodyFatPct?: number | null;
  targetNotes?: string | null;
  firstVisit: GoalVisit | null;
  latestVisit: GoalVisit | null;
  action: (formData: FormData) => Promise<ActionResult>;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function calculateProgress(
  startValue: number | null | undefined,
  currentValue: number | null | undefined,
  targetValue: number | null | undefined
) {
  if (
    startValue === null ||
    startValue === undefined ||
    currentValue === null ||
    currentValue === undefined ||
    targetValue === null ||
    targetValue === undefined
  ) {
    return 0;
  }

  if (startValue === targetValue) {
    return currentValue === targetValue ? 100 : 0;
  }

  const progress = ((currentValue - startValue) / (targetValue - startValue)) * 100;
  return clamp(progress);
}

function formatValue(value: number | null | undefined, unit: string) {
  if (value === null || value === undefined) {
    return "-";
  }

  const formatted = new Intl.NumberFormat("it-IT", {
    maximumFractionDigits: 1,
  }).format(value);

  return `${formatted} ${unit}`;
}

function progressTone(progress: number) {
  if (progress < 25) {
    return "bg-rose-400";
  }
  if (progress <= 75) {
    return "bg-amber-300";
  }
  return "bg-emerald-400";
}

function ProgressRow({
  label,
  current,
  target,
  progress,
  unit,
}: {
  label: string;
  current: number | null | undefined;
  target: number | null | undefined;
  progress: number;
  unit: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className="font-medium">
          {formatValue(current, unit)}
          <span className="text-white/40"> {"->"} </span>
          {formatValue(target, unit)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className={cn("h-2 rounded-full transition-all", progressTone(progress))}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-end text-xs text-white/65">
        {Math.round(progress)}%
      </div>
    </div>
  );
}

export function PatientGoalsCard({
  patientName,
  targetWeightKg,
  targetBodyFatPct,
  targetNotes,
  firstVisit,
  latestVisit,
  action,
}: PatientGoalsCardProps) {
  const [open, setOpen] = useState(false);

  const hasGoals =
    [targetWeightKg, targetBodyFatPct].some((value) => value !== null && value !== undefined) ||
    Boolean(targetNotes?.trim());

  const progress = {
    weight: calculateProgress(firstVisit?.weightKg, latestVisit?.weightKg, targetWeightKg),
    bodyFat: calculateProgress(
      firstVisit?.bodyFatPct,
      latestVisit?.bodyFatPct,
      targetBodyFatPct
    ),
  };

  const dialogTitle = hasGoals ? "Modifica obiettivi" : "Imposta obiettivi";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {hasGoals ? (
        <Card className="bg-[linear-gradient(180deg,rgba(18,24,26,0.95),rgba(30,37,39,0.98))] text-white">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>Obiettivi clinici</CardTitle>
                <CardDescription className="text-white/65">
                  Progresso rispetto alla prima visita disponibile.
                </CardDescription>
              </div>
              <DialogTrigger render={<Button variant="outline" size="sm" />}>
                Modifica
              </DialogTrigger>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {targetWeightKg !== null && targetWeightKg !== undefined && (
              <ProgressRow
                label="Peso"
                current={latestVisit?.weightKg ?? null}
                target={targetWeightKg}
                progress={progress.weight}
                unit="kg"
              />
            )}
            {targetBodyFatPct !== null && targetBodyFatPct !== undefined && (
              <ProgressRow
                label="Body fat"
                current={latestVisit?.bodyFatPct ?? null}
                target={targetBodyFatPct}
                progress={progress.bodyFat}
                unit="%"
              />
            )}
            {targetNotes?.trim() && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/85">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                  Nota obiettivo
                </p>
                <p className="mt-2 leading-6">{targetNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <DialogTrigger render={<Button className="w-full" />}>
          Imposta obiettivi
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            Imposta peso target, body fat target e una nota di riferimento per{" "}
            <strong>{patientName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <PatientGoalsForm
          action={action}
          defaultValues={{
            targetWeightKg: targetWeightKg ?? undefined,
            targetBodyFatPct: targetBodyFatPct ?? undefined,
            targetNotes: targetNotes ?? undefined,
          }}
          submitLabel="Salva obiettivi"
        />
      </DialogContent>
    </Dialog>
  );
}
