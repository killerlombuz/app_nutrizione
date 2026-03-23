"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SupplementFormProps {
  action: (formData: FormData) => Promise<{ error?: Record<string, string[]> } | void>;
  defaultValues?: Record<string, unknown>;
  submitLabel?: string;
}

export function SupplementForm({
  action,
  defaultValues = {},
  submitLabel = "Salva",
}: SupplementFormProps) {
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
          {defaultValues.name ? "Modifica Integratore" : "Nuovo Integratore"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={(defaultValues.name as string) ?? ""}
              required
            />
            {errors?.name && (
              <p className="text-sm text-red-600">{errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={(defaultValues.description as string) ?? ""}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultDosage">Dosaggio predefinito</Label>
              <Input
                id="defaultDosage"
                name="defaultDosage"
                defaultValue={(defaultValues.defaultDosage as string) ?? ""}
                placeholder="es. 1 capsula"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timing">Quando</Label>
              <Input
                id="timing"
                name="timing"
                defaultValue={(defaultValues.timing as string) ?? ""}
                placeholder="es. dopo i pasti"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvataggio..." : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
