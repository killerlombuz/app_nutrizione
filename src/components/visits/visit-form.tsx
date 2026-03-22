"use client";

import { useActionState } from "react";
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

interface VisitFormProps {
  action: (formData: FormData) => Promise<{ error?: Record<string, string[]> } | void>;
  defaultValues?: Record<string, unknown>;
  submitLabel?: string;
}

const plicFields = [
  { name: "plicChest", label: "Petto" },
  { name: "plicTricep", label: "Tricipite" },
  { name: "plicAxillary", label: "Ascella" },
  { name: "plicSubscapular", label: "Scapola" },
  { name: "plicSuprailiac", label: "Soprailiaca" },
  { name: "plicAbdominal", label: "Addominale" },
  { name: "plicThigh", label: "Coscia" },
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

export function VisitForm({
  action,
  defaultValues = {},
  submitLabel = "Salva Visita",
}: VisitFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      return await action(formData);
    },
    null
  );

  const errors = (state as { error?: Record<string, string[]> })?.error;

  return (
    <form action={formAction} className="space-y-6">
      {/* Info base */}
      <Card>
        <CardHeader>
          <CardTitle>Dati Visita</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={
                  (defaultValues.date as string) ??
                  new Date().toISOString().split("T")[0]
                }
                required
              />
              {errors?.date && (
                <p className="text-sm text-red-600">{errors.date[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weightKg">Peso (kg) *</Label>
              <Input
                id="weightKg"
                name="weightKg"
                type="number"
                step="0.1"
                defaultValue={(defaultValues.weightKg as number) ?? ""}
                required
              />
              {errors?.weightKg && (
                <p className="text-sm text-red-600">{errors.weightKg[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="formulaUsed">Formula</Label>
              <Select
                name="formulaUsed"
                defaultValue={(defaultValues.formulaUsed as string) ?? "f_media"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="f_media">Media (JP3+JP7)</SelectItem>
                  <SelectItem value="jp3">Solo JP3</SelectItem>
                  <SelectItem value="jp7">Solo JP7</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plicometria */}
      <Card>
        <CardHeader>
          <CardTitle>Plicometria (7 siti) — mm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            {plicFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  step="0.1"
                  defaultValue={(defaultValues[field.name] as number) ?? ""}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Circonferenze */}
      <Card>
        <CardHeader>
          <CardTitle>Circonferenze (11 siti) — cm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            {circFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  step="0.1"
                  defaultValue={(defaultValues[field.name] as number) ?? ""}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvataggio..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
