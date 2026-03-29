"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveAllWorkingHours } from "@/features/working-hours/actions";

interface WorkingHoursEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}

interface WorkingHoursFormProps {
  initialValues: WorkingHoursEntry[];
}

const DAY_LABELS = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

const DEFAULT_HOURS: WorkingHoursEntry[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  startTime: "09:00",
  endTime: "18:00",
  slotDuration: 30,
  isActive: i >= 1 && i <= 5,
}));

export function WorkingHoursForm({ initialValues }: WorkingHoursFormProps) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [entries, setEntries] = useState<WorkingHoursEntry[]>(() => {
    return DEFAULT_HOURS.map((def) => {
      const existing = initialValues.find((v) => v.dayOfWeek === def.dayOfWeek);
      return existing ?? def;
    });
  });

  function updateEntry(dayOfWeek: number, patch: Partial<WorkingHoursEntry>) {
    setEntries((prev) =>
      prev.map((e) => (e.dayOfWeek === dayOfWeek ? { ...e, ...patch } : e))
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    startTransition(async () => {
      await saveAllWorkingHours(entries);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {entries.map((entry) => (
        <div
          key={entry.dayOfWeek}
          className="grid grid-cols-[auto_1fr_1fr_80px_auto] items-center gap-3 rounded-xl border border-border bg-white/60 px-4 py-3"
        >
          <div className="flex items-center gap-2 min-w-[110px]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={entry.isActive}
                onChange={(e) => updateEntry(entry.dayOfWeek, { isActive: e.target.checked })}
                className="rounded border-input size-4 accent-primary"
              />
              <span className={`text-sm font-medium ${!entry.isActive ? "text-muted-foreground" : ""}`}>
                {DAY_LABELS[entry.dayOfWeek]}
              </span>
            </label>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Inizio</Label>
            <Input
              type="time"
              value={entry.startTime}
              onChange={(e) => updateEntry(entry.dayOfWeek, { startTime: e.target.value })}
              disabled={!entry.isActive}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Fine</Label>
            <Input
              type="time"
              value={entry.endTime}
              onChange={(e) => updateEntry(entry.dayOfWeek, { endTime: e.target.value })}
              disabled={!entry.isActive}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Slot (min)</Label>
            <Input
              type="number"
              value={entry.slotDuration}
              onChange={(e) => updateEntry(entry.dayOfWeek, { slotDuration: Number(e.target.value) })}
              disabled={!entry.isActive}
              min={15}
              max={120}
              step={15}
              className="h-9 text-sm"
            />
          </div>

          <div className={`text-xs text-center ${entry.isActive ? "text-emerald-600 font-medium" : "text-muted-foreground"}`}>
            {entry.isActive ? "Attivo" : "Off"}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-2">
        {success && (
          <p className="text-sm text-emerald-600">Orari salvati.</p>
        )}
        <div className="ml-auto">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvataggio..." : "Salva orari"}
          </Button>
        </div>
      </div>
    </form>
  );
}
