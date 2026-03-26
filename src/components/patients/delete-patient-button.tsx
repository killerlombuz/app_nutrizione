"use client";

import { useState } from "react";
import { deletePatient } from "@/features/patients/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeletePatientButton({
  patientId,
  patientName,
}: {
  patientId: string;
  patientName: string;
}) {
  const [open, setOpen] = useState(false);
  const deletePatientAction = deletePatient.bind(null, patientId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
          Elimina Paziente
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conferma eliminazione</DialogTitle>
          <DialogDescription>
            Sei sicuro di voler eliminare <strong>{patientName}</strong>? Tutti i
            dati associati (visite, piani dieta, documenti) verranno eliminati
            permanentemente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <form action={deletePatientAction}>
            <Button type="submit" variant="destructive">
              Elimina
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
