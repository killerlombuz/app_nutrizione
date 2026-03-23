"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface InstructionFormProps {
  action: (formData: FormData) => Promise<{ error?: Record<string, string[]> } | void>;
  defaultValues?: Record<string, unknown>;
  submitLabel?: string;
}

export function InstructionForm({
  action,
  defaultValues = {},
  submitLabel = "Salva",
}: InstructionFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      return await action(formData);
    },
    null
  );

  const errors = (state as { error?: Record<string, string[]> })?.error;

  return (
    <form action={formAction} className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria *</Label>
          <Input
            id="category"
            name="category"
            defaultValue={(defaultValues.category as string) ?? ""}
            placeholder="es. Idratazione"
            required
          />
          {errors?.category && (
            <p className="text-sm text-red-600">{errors.category[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Titolo</Label>
          <Input
            id="title"
            name="title"
            defaultValue={(defaultValues.title as string) ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sortOrder">Ordine</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min="0"
            defaultValue={(defaultValues.sortOrder as number) ?? 0}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Contenuto</Label>
        <Textarea
          id="content"
          name="content"
          rows={4}
          defaultValue={(defaultValues.content as string) ?? ""}
          placeholder="Testo dell'istruzione..."
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvataggio..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
