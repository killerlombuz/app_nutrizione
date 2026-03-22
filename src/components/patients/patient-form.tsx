"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PatientFormProps {
  action: (formData: FormData) => Promise<{ error?: Record<string, string[]> } | void>;
  defaultValues?: {
    name?: string;
    birthDate?: string;
    heightCm?: number | null;
    gender?: string | null;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
  };
  submitLabel?: string;
}

export function PatientForm({
  action,
  defaultValues,
  submitLabel = "Salva",
}: PatientFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      return await action(formData);
    },
    null
  );

  const errors = (state as { error?: Record<string, string[]> })?.error;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {defaultValues ? "Modifica Paziente" : "Nuovo Paziente"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={defaultValues?.name}
                required
              />
              {errors?.name && (
                <p className="text-sm text-red-600">{errors.name[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Data di nascita</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={defaultValues?.birthDate}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heightCm">Altezza (cm)</Label>
              <Input
                id="heightCm"
                name="heightCm"
                type="number"
                step="0.1"
                defaultValue={defaultValues?.heightCm ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Genere</Label>
              <Select
                name="gender"
                defaultValue={defaultValues?.gender ?? ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="F">Donna</SelectItem>
                  <SelectItem value="M">Uomo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={defaultValues?.email ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={defaultValues?.phone ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={defaultValues?.notes ?? ""}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvataggio..." : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
