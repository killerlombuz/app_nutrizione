"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChefHat,
  Plus,
  Stethoscope,
  UserPlus,
  UtensilsCrossed,
} from "lucide-react";
import { PatientSearchDialog } from "@/components/dashboard/patient-search-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface PatientSummary {
  id: string;
  name: string;
}

export function GlobalActionsMenu({
  patients,
  className,
}: {
  patients: PatientSummary[];
  className?: string;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"visit" | "meal-plan" | null>(null);
  const hasPatients = patients.length > 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className={cn("shrink-0", className)}
              aria-label="Apri azioni rapide"
            />
          }
        >
          <Plus className="size-4" />
          <span className="hidden md:inline">Azioni</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-1" sideOffset={8}>
          <DropdownMenuLabel>Azioni rapide</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push("/patients/new")}>
            <UserPlus className="size-4" />
            Nuovo paziente
            <DropdownMenuShortcut>Clinica</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/recipes/new")}>
            <ChefHat className="size-4" />
            Nuova ricetta
            <DropdownMenuShortcut>Libreria</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel inset={!hasPatients}>Azioni dal paziente</DropdownMenuLabel>
          <DropdownMenuItem disabled={!hasPatients} onClick={() => setDialog("visit")}>
            <Stethoscope className="size-4" />
            Nuova visita
            <DropdownMenuShortcut>
              {hasPatients ? "Seleziona" : "Nessun paziente"}
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!hasPatients}
            onClick={() => setDialog("meal-plan")}
          >
            <UtensilsCrossed className="size-4" />
            Nuovo piano
            <DropdownMenuShortcut>
              {hasPatients ? "Seleziona" : "Nessun paziente"}
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PatientSearchDialog
        patients={patients}
        open={dialog === "visit"}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        targetPath={(id) => `/patients/${id}/visits/new`}
        title="Nuova Visita"
        description="Seleziona il paziente da visitare per continuare il flusso clinico."
      />
      <PatientSearchDialog
        patients={patients}
        open={dialog === "meal-plan"}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        targetPath={(id) => `/patients/${id}/meal-plans/new`}
        title="Nuovo Piano Dieta"
        description="Seleziona il paziente per costruire subito un nuovo piano dieta."
      />
    </>
  );
}
