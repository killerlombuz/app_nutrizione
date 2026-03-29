"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { createDiaryEntry } from "@/features/food-diary/actions";

const MEAL_TYPE_OPTIONS = [
  { value: "COLAZIONE", label: "Colazione" },
  { value: "SPUNTINO_MATTINA", label: "Spuntino mattina" },
  { value: "PRANZO", label: "Pranzo" },
  { value: "SPUNTINO_POMERIGGIO", label: "Spuntino pomeriggio" },
  { value: "CENA", label: "Cena" },
  { value: "SPUNTINO_SERA", label: "Spuntino sera" },
];

export function DiaryEntryForm() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createDiaryEntry(formData);
      if (result.error) {
        const firstError = Object.values(result.error)[0]?.[0];
        setError(firstError ?? "Errore durante il salvataggio");
        return;
      }
      formRef.current?.reset();
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors w-full"
      >
        <Plus className="size-4" />
        Aggiungi voce al diario
      </button>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Nuova voce</h3>
        <button
          onClick={() => {
            setOpen(false);
            setError("");
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="size-4" />
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Data
            </label>
            <input
              type="date"
              name="date"
              defaultValue={today}
              required
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Pasto
            </label>
            <select
              name="mealType"
              required
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {MEAL_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Cosa hai mangiato?
          </label>
          <textarea
            name="description"
            required
            rows={3}
            placeholder="Es: 80g di pasta integrale con pomodoro e basilico, insalata mista..."
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm resize-none focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Note (facoltative)
          </label>
          <input
            type="text"
            name="notes"
            placeholder="Come ti sei sentito? Hai rispettato il piano?"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Salvataggio..." : "Salva"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setError("");
            }}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}
