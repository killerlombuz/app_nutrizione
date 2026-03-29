"use client";

import { useTransition } from "react";
import { deletePatientNote, toggleNotePin } from "@/features/patient-notes/actions";
import { Button } from "@/components/ui/button";
import { Pin, PinOff, Trash2 } from "lucide-react";

export function NoteActions({
  noteId,
  patientId,
  isPinned,
}: {
  noteId: string;
  patientId: string;
  isPinned: boolean;
}) {
  const [, startTransition] = useTransition();

  function handleTogglePin() {
    startTransition(async () => {
      await toggleNotePin(noteId, patientId);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deletePatientNote(noteId, patientId);
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={handleTogglePin}
      >
        {isPinned ? (
          <PinOff className="size-3.5 text-violet-500" />
        ) : (
          <Pin className="size-3.5 text-muted-foreground" />
        )}
        <span className="sr-only">{isPinned ? "Rimuovi pin" : "Metti in evidenza"}</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={handleDelete}
      >
        <Trash2 className="size-3.5 text-muted-foreground" />
        <span className="sr-only">Elimina nota</span>
      </Button>
    </div>
  );
}
