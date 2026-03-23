"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsFormProps {
  action: (formData: FormData) => Promise<{ error?: Record<string, string[]>; success?: boolean } | void>;
  defaultValues: {
    name: string;
    title: string;
    phone: string;
    logoUrl: string;
  };
}

export function SettingsForm({ action, defaultValues }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      return await action(formData);
    },
    null
  );

  const errors = (state as { error?: Record<string, string[]> })?.error;
  const success = (state as { success?: boolean })?.success;

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={defaultValues.name}
            required
          />
          {errors?.name && (
            <p className="text-sm text-red-600">{errors.name[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Titolo professionale</Label>
          <Input
            id="title"
            name="title"
            defaultValue={defaultValues.title}
            placeholder="es. Biologo Nutrizionista"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Telefono</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={defaultValues.phone}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="logoUrl">URL Logo</Label>
          <Input
            id="logoUrl"
            name="logoUrl"
            defaultValue={defaultValues.logoUrl}
            placeholder="https://..."
          />
        </div>
      </div>

      {success && (
        <p className="text-sm text-green-600">Profilo aggiornato.</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvataggio..." : "Salva Profilo"}
        </Button>
      </div>
    </form>
  );
}
