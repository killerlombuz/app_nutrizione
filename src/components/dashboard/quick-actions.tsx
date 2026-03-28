"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PendingLink } from "@/components/navigation/pending-link";
import { PatientSearchDialog } from "@/components/dashboard/patient-search-dialog";
import { ChefHat, Stethoscope, UtensilsCrossed, UserPlus } from "lucide-react";

interface Patient {
  id: string;
  name: string;
}

interface QuickActionsProps {
  patients: Patient[];
}

export function QuickActions({ patients }: QuickActionsProps) {
  const [dialog, setDialog] = useState<"visit" | "meal-plan" | null>(null);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          render={
            <PendingLink
              href="/patients/new"
              tone="button"
              pendingLabel="Apro la creazione del paziente"
            />
          }
        >
          <UserPlus />
          Nuovo Paziente
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDialog("visit")}
        >
          <Stethoscope />
          Nuova Visita
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDialog("meal-plan")}
        >
          <UtensilsCrossed />
          Nuovo Piano
        </Button>
        <Button
          variant="outline"
          size="sm"
          render={
            <PendingLink
              href="/recipes/new"
              tone="button"
              pendingLabel="Apro la creazione della ricetta"
            />
          }
        >
          <ChefHat />
          Nuova Ricetta
        </Button>
      </div>

      <PatientSearchDialog
        patients={patients}
        open={dialog === "visit"}
        onOpenChange={(open) => { if (!open) setDialog(null); }}
        targetPath={(id) => `/patients/${id}/visits/new`}
        title="Nuova Visita"
        description="Seleziona il paziente per cui registrare la visita."
      />
      <PatientSearchDialog
        patients={patients}
        open={dialog === "meal-plan"}
        onOpenChange={(open) => { if (!open) setDialog(null); }}
        targetPath={(id) => `/patients/${id}/meal-plans/new`}
        title="Nuovo Piano Dieta"
        description="Seleziona il paziente per cui creare il piano dieta."
      />
    </>
  );
}
