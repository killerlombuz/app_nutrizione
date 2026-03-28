"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Patient {
  id: string;
  name: string;
}

interface PatientSearchDialogProps {
  patients: Patient[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPath: (patientId: string) => string;
  title: string;
  description: string;
}

export function PatientSearchDialog({
  patients,
  open,
  onOpenChange,
  targetPath,
  title,
  description,
}: PatientSearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  function handleSelect(patientId: string) {
    onOpenChange(false);
    setQuery("");
    router.push(targetPath(patientId));
  }

  function handleOpenChange(open: boolean) {
    if (!open) setQuery("");
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cerca paziente..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {filtered.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              Nessun paziente trovato.
            </p>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p.id)}
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/70"
              >
                {p.name}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
