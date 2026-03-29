"use client";

import { useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

const CATEGORIES = [
  { value: "", label: "Categoria (opzionale)" },
  { value: "clinica", label: "Clinica" },
  { value: "comunicazione", label: "Comunicazione" },
  { value: "follow-up", label: "Follow-up" },
  { value: "altro", label: "Altro" },
];

export function QuickNoteForm({
  action,
}: {
  action: (formData: FormData) => Promise<unknown>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await action(formData);
      formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
    >
      <Textarea
        name="content"
        placeholder="Scrivi una nota rapida..."
        required
        className="min-h-[60px] flex-1 resize-none"
        rows={2}
      />
      <div className="flex shrink-0 gap-2 sm:flex-col">
        <select
          name="category"
          className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={isPending} size="sm">
          <Plus className="size-4" />
          {isPending ? "Salvo..." : "Aggiungi"}
        </Button>
      </div>
    </form>
  );
}
