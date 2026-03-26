"use client";

import { useActionState, useMemo, useState } from "react";
import { Activity, Ruler, Save, Scale, Shapes, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import {
  calculateAge,
  calculateBodyComposition,
  calculateBmi,
} from "@/lib/calculations/body-composition";
import { bmrKatchMcArdle } from "@/lib/calculations/metabolism";
import { PendingLink } from "@/components/navigation/pending-link";

interface VisitFormProps {
  action: (formData: FormData) => Promise<{ error?: Record<string, string[]> } | void>;
  patient: {
    id: string;
    name: string;
    gender?: "M" | "F" | null;
    heightCm?: number | null;
    birthDate?: string | null;
  };
  cancelHref: string;
  defaultValues?: Record<string, unknown>;
  submitLabel?: string;
  title?: string;
  description?: string;
}

type VisitFormState = Record<string, string>;

const plicFields = [
  { name: "plicChest", label: "Pettorale", hint: "Meta tra ascella e capezzolo." },
  { name: "plicAxillary", label: "Ascellare", hint: "Lungo la linea ascellare media." },
  { name: "plicTricep", label: "Tricipite", hint: "Verticale sul retro del braccio." },
  { name: "plicSubscapular", label: "Sottoscapolare", hint: "Obliqua sotto la scapola." },
  { name: "plicAbdominal", label: "Addominale", hint: "Verticale a lato dell'ombelico." },
  { name: "plicSuprailiac", label: "Soprailiaca", hint: "Obliqua sopra la cresta iliaca." },
  { name: "plicThigh", label: "Coscia", hint: "Verticale sulla parte anteriore." },
] as const;

const circFields = [
  { name: "circNeck", label: "Collo" },
  { name: "circChest", label: "Torace" },
  { name: "circArmRelaxed", label: "Braccio rilassato" },
  { name: "circArmFlexed", label: "Braccio contratto" },
  { name: "circWaist", label: "Vita" },
  { name: "circLowerAbdomen", label: "Addome basso" },
  { name: "circHips", label: "Fianchi" },
  { name: "circUpperThigh", label: "Coscia alta" },
  { name: "circMidThigh", label: "Coscia media" },
  { name: "circLowerThigh", label: "Coscia bassa" },
  { name: "circCalf", label: "Polpaccio" },
] as const;

function toFieldString(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function buildInitialState(defaultValues: Record<string, unknown>): VisitFormState {
  const names = [
    "date",
    "weightKg",
    "formulaUsed",
    ...plicFields.map((field) => field.name),
    ...circFields.map((field) => field.name),
  ];

  return Object.fromEntries(
    names.map((name) => [
      name,
      name === "date"
        ? toFieldString(defaultValues[name] ?? new Date().toISOString().split("T")[0])
        : name === "formulaUsed"
          ? toFieldString(defaultValues[name] ?? "f_media")
          : toFieldString(defaultValues[name]),
    ])
  );
}

function parseNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMetric(
  value: number | null | undefined,
  formatter: (metric: number) => string
) {
  return value === null || value === undefined ? "-" : formatter(value);
}

export function VisitForm({
  action,
  patient,
  cancelHref,
  defaultValues = {},
  submitLabel = "Salva visita",
  title = "Nuova Visita",
  description = "Inserimento dati antropometrici e plicometrici per il monitoraggio della composizione corporea.",
}: VisitFormProps) {
  const [values, setValues] = useState<VisitFormState>(() => buildInitialState(defaultValues));
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      return await action(formData);
    },
    null
  );

  const errors = (state as { error?: Record<string, string[]> })?.error;

  const measurementDate = values.date ? new Date(values.date) : null;
  const weightKg = parseNumber(values.weightKg);
  const age =
    patient.birthDate && measurementDate
      ? calculateAge(new Date(patient.birthDate), measurementDate)
      : null;

  const preview = useMemo(() => {
    if (!weightKg) {
      return null;
    }

    const bmi = patient.heightCm ? calculateBmi(weightKg, patient.heightCm) : null;
    const canRunComposition =
      patient.gender &&
      patient.heightCm &&
      age !== null &&
      parseNumber(values.plicChest) !== null &&
      parseNumber(values.plicTricep) !== null &&
      parseNumber(values.plicThigh) !== null;

    if (!canRunComposition) {
      return { bmi, bodyFatPct: null, fatMassKg: null, leanMassKg: null, bmr: null };
    }

    const result = calculateBodyComposition({
      gender: patient.gender as "M" | "F",
      age,
      weightKg,
      heightCm: patient.heightCm as number,
      plicChest: parseNumber(values.plicChest) ?? 0,
      plicTricep: parseNumber(values.plicTricep) ?? 0,
      plicAxillary: parseNumber(values.plicAxillary) ?? 0,
      plicSubscapular: parseNumber(values.plicSubscapular) ?? 0,
      plicSuprailiac: parseNumber(values.plicSuprailiac) ?? 0,
      plicAbdominal: parseNumber(values.plicAbdominal) ?? 0,
      plicThigh: parseNumber(values.plicThigh) ?? 0,
      formula: values.formulaUsed || "f_media",
    });

    return {
      bmi: result.bmi,
      bodyFatPct: result.bodyFatPct,
      fatMassKg: result.fatMassKg,
      leanMassKg: result.leanMassKg,
      bmr: bmrKatchMcArdle(result.leanMassKg),
    };
  }, [
    age,
    patient.gender,
    patient.heightCm,
    values.formulaUsed,
    values.plicAbdominal,
    values.plicAxillary,
    values.plicChest,
    values.plicSubscapular,
    values.plicSuprailiac,
    values.plicThigh,
    values.plicTricep,
    weightKg,
  ]);

  function updateField(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  const completionCount =
    plicFields.filter((field) => parseNumber(values[field.name]) !== null).length +
    circFields.filter((field) => parseNumber(values[field.name]) !== null).length;
  const totalFields = plicFields.length + circFields.length;

  return (
    <form action={formAction} className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[2rem] bg-white/[0.72] px-6 py-6 shadow-[var(--shadow-soft)] ring-1 ring-black/5 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary">
            Visita antropometrica
          </p>
          <div className="space-y-1">
            <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em]">
              {title} - {patient.name}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            render={
              <PendingLink
                href={cancelHref}
                tone="button"
                pendingLabel="Torno alla pagina precedente"
              />
            }
          >
            <X className="size-4" />
            Annulla
          </Button>
          <Button type="submit" disabled={isPending}>
            <Save className="size-4" />
            {isPending ? "Salvataggio..." : submitLabel}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <section className="rounded-[1.8rem] bg-[var(--surface-low)] p-6 shadow-[var(--shadow-soft)]">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-6 w-1.5 rounded-full bg-primary" />
              <div>
                <h2 className="font-heading text-lg font-semibold">Dati generali</h2>
                <p className="text-sm text-muted-foreground">
                  Base antropometrica per il calcolo della visita.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={values.date}
                  onChange={(event) => updateField("date", event.target.value)}
                  required
                />
                {errors?.date ? <p className="text-sm text-red-600">{errors.date[0]}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weightKg">Peso (kg) *</Label>
                <Input
                  id="weightKg"
                  name="weightKg"
                  type="number"
                  step="0.1"
                  value={values.weightKg}
                  onChange={(event) => updateField("weightKg", event.target.value)}
                  required
                />
                {errors?.weightKg ? (
                  <p className="text-sm text-red-600">{errors.weightKg[0]}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientHeight">Altezza (cm)</Label>
                <Input
                  id="patientHeight"
                  value={patient.heightCm ? String(patient.heightCm) : "-"}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientAge">Eta</Label>
                <Input id="patientAge" value={age !== null ? String(age) : "-"} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="formulaUsed">Formula</Label>
                <Select
                  name="formulaUsed"
                  value={values.formulaUsed}
                  onValueChange={(value) => updateField("formulaUsed", value ?? "f_media")}
                >
                  <SelectTrigger id="formulaUsed" className="h-11 w-full rounded-2xl bg-white/[0.88] px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="f_media">Media JP3 + JP7</SelectItem>
                    <SelectItem value="jp3">Solo JP3</SelectItem>
                    <SelectItem value="jp7">Solo JP7</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-6 w-1.5 rounded-full bg-primary" />
                <div>
                  <h2 className="font-heading text-lg font-semibold">
                    Plicometria Jackson-Pollock 7
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Misure in millimetri per la composizione corporea.
                  </p>
                </div>
              </div>
              <Badge variant="outline">Unita mm</Badge>
            </div>

            <Card className="bg-white/[0.78]">
              <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
                {plicFields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.1"
                      value={values[field.name]}
                      onChange={(event) => updateField(field.name, event.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">{field.hint}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-6 w-1.5 rounded-full bg-primary" />
                <div>
                  <h2 className="font-heading text-lg font-semibold">Circonferenze corporee</h2>
                  <p className="text-sm text-muted-foreground">
                    Misure accessorie in centimetri per il follow-up.
                  </p>
                </div>
              </div>
              <Badge variant="outline">Unita cm</Badge>
            </div>

            <Card className="bg-white/[0.78]">
              <CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-3">
                {circFields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.1"
                      value={values[field.name]}
                      onChange={(event) => updateField(field.name, event.target.value)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-28">
          <Card className="bg-white/[0.78]">
            <CardHeader>
              <CardTitle>Anteprima risultati</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[1.3rem] bg-[var(--surface-low)] p-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    BMI
                  </p>
                  <p className="mt-2 font-heading text-3xl font-semibold">
                    {formatMetric(preview?.bmi, (value) => value.toFixed(1))}
                  </p>
                </div>
                <div className="rounded-[1.3rem] bg-[var(--surface-low)] p-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Massa grassa
                  </p>
                  <p className="mt-2 font-heading text-3xl font-semibold">
                    {formatMetric(preview?.bodyFatPct, (value) => `${value.toFixed(1)}%`)}
                  </p>
                </div>
                <div className="rounded-[1.3rem] bg-[var(--surface-low)] p-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Massa magra
                  </p>
                  <p className="mt-2 font-heading text-2xl font-semibold">
                    {formatMetric(preview?.leanMassKg, (value) => `${value.toFixed(1)} kg`)}
                  </p>
                </div>
                <div className="rounded-[1.3rem] bg-[var(--surface-low)] p-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Massa adiposa
                  </p>
                  <p className="mt-2 font-heading text-2xl font-semibold">
                    {formatMetric(preview?.fatMassKg, (value) => `${value.toFixed(1)} kg`)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(180deg,rgba(18,24,26,0.95),rgba(30,37,39,0.98))] text-white">
            <CardHeader>
              <CardTitle>Metabolismo di base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-white/10">
                  <Activity className="size-4" />
                </div>
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/55">
                    Katch-McArdle
                  </p>
                  <p className="font-heading text-3xl font-semibold">
                    {formatMetric(preview?.bmr, (value) => String(Math.round(value)))}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <Scale className="size-4" />
                  <span>
                    Peso rilevato: {formatMetric(weightKg, (value) => `${value.toFixed(1)} kg`)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Shapes className="size-4" />
                  <span>
                    Formula:{" "}
                    {values.formulaUsed === "jp3"
                      ? "JP3"
                      : values.formulaUsed === "jp7"
                        ? "JP7"
                        : "Media"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="size-4" />
                  <span>
                    Campi compilati: {completionCount}/{totalFields}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.78]">
            <CardHeader>
              <CardTitle>Prerequisiti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Per la composizione corporea completa servono altezza, data di nascita, sesso e
                almeno pettorale, tricipite e coscia.
              </p>
              <div className="rounded-[1.2rem] bg-[var(--surface-low)] p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Stato paziente
                </p>
                <p className="mt-2 font-medium">
                  {patient.heightCm ? `${patient.heightCm} cm` : "Altezza non disponibile"}
                </p>
                <p className="text-muted-foreground">
                  {patient.birthDate ? "Data di nascita presente" : "Data di nascita mancante"}
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </form>
  );
}
