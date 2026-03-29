"use client";

import { useState, useTransition } from "react";
import { BookmarkPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { saveAsTemplate } from "@/features/meal-plan-templates/actions";

const DIET_TYPE_OPTIONS = [
  { value: "", label: "Nessun tipo" },
  { value: "mediterranea", label: "Mediterranea" },
  { value: "low-carb", label: "Low-carb" },
  { value: "iperproteica", label: "Iperproteica" },
  { value: "vegetariana", label: "Vegetariana" },
  { value: "vegana", label: "Vegana" },
];

interface SaveAsTemplateDialogProps {
  patientId: string;
  planId: string;
  planName: string | null;
}

export function SaveAsTemplateDialog({ patientId, planId, planName }: SaveAsTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(planName ?? "");
  const [dietType, setDietType] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleSubmit() {
    if (!name.trim()) return;
    startTransition(async () => {
      await saveAsTemplate(patientId, planId, name, dietType);
      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
      }, 1200);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <BookmarkPlus />
            Salva come template
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Salva come template</DialogTitle>
        </DialogHeader>

        {done ? (
          <p className="py-4 text-center text-sm text-emerald-700">
            Template salvato nei tuoi template personali.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome template</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Es. Piano estate 2025"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo dieta (opzionale)</Label>
              <Select value={dietType} onValueChange={(v) => setDietType(v ?? "")}>
                <SelectTrigger className="h-11 w-full rounded-2xl bg-white/[0.88] px-4">
                  <SelectValue placeholder="Seleziona..." />
                </SelectTrigger>
                <SelectContent>
                  {DIET_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || isPending}
              className="w-full"
            >
              {isPending ? "Salvataggio..." : "Salva template"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
