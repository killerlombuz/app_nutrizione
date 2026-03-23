"use client";

import { deleteInstruction } from "@/features/instructions/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function DeleteInstructionButton({
  instructionId,
}: {
  instructionId: string;
}) {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive"
      onClick={async () => {
        await deleteInstruction(instructionId);
        router.refresh();
      }}
    >
      Elimina
    </Button>
  );
}
