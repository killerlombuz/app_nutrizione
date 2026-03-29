"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteDiaryEntry } from "@/features/food-diary/actions";

export function DeleteDiaryEntryButton({ entryId }: { entryId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        startTransition(async () => {
          await deleteDiaryEntry(entryId);
        });
      }}
      disabled={isPending}
      className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
      aria-label="Elimina voce"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}
