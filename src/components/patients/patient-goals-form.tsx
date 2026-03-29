"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ActionResult = { error?: Record<string, string[]> } | void;
type ActionState = { error?: Record<string, string[]> } | null;

export interface PatientGoalsFormProps {
  action: (formData: FormData) => Promise<ActionResult>;
  defaultValues?: {
    targetWeightKg?: number | null;
    targetBodyFatPct?: number | null;
    targetNotes?: string | null;
  };
  submitLabel?: string;
}

export function PatientGoalsForm({
  action,
  defaultValues,
  submitLabel = "Salva obiettivi",
}: PatientGoalsFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      return (await action(formData)) ?? null;
    },
    null
  );

  const errors = state?.error;

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="targetWeightKg">Peso obiettivo (kg)</Label>
          <Input
            id="targetWeightKg"
            name="targetWeightKg"
            type="number"
            min="0"
            step="0.1"
            defaultValue={defaultValues?.targetWeightKg ?? ""}
          />
          {errors?.targetWeightKg && (
            <p className="text-sm text-red-600">{errors.targetWeightKg[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetBodyFatPct">Body fat obiettivo (%)</Label>
          <Input
            id="targetBodyFatPct"
            name="targetBodyFatPct"
            type="number"
            min="0"
            step="0.1"
            defaultValue={defaultValues?.targetBodyFatPct ?? ""}
          />
          {errors?.targetBodyFatPct && (
            <p className="text-sm text-red-600">{errors.targetBodyFatPct[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetNotes">Note obiettivo</Label>
        <Textarea
          id="targetNotes"
          name="targetNotes"
          rows={3}
          placeholder="Raggiungere 75kg entro giugno"
          defaultValue={defaultValues?.targetNotes ?? ""}
        />
        {errors?.targetNotes && (
          <p className="text-sm text-red-600">{errors.targetNotes[0]}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <DialogClose render={<Button variant="outline" type="button" />}>
          Annulla
        </DialogClose>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvataggio..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
