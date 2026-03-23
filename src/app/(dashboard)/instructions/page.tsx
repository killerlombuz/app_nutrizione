import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstructionForm } from "@/components/instructions/instruction-form";
import { createInstruction, updateInstruction } from "@/features/instructions/actions";
import { DeleteInstructionButton } from "@/components/instructions/delete-instruction-button";

export default async function InstructionsPage() {
  const professionalId = await requireProfessionalId();

  const instructions = await prisma.dietaryInstruction.findMany({
    where: { professionalId },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Istruzioni Dietetiche ({instructions.length})
      </h1>

      {/* Lista istruzioni esistenti */}
      {instructions.length > 0 && (
        <div className="space-y-4">
          {instructions.map((instr) => (
            <Card key={instr.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">
                  {instr.category}
                  {instr.title && (
                    <span className="ml-2 font-normal text-muted-foreground">
                      — {instr.title}
                    </span>
                  )}
                  <span className="ml-2 text-xs text-muted-foreground">
                    (ordine: {instr.sortOrder})
                  </span>
                </CardTitle>
                <DeleteInstructionButton instructionId={instr.id} />
              </CardHeader>
              <CardContent>
                {instr.content ? (
                  <p className="whitespace-pre-line text-sm">{instr.content}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nessun contenuto.
                  </p>
                )}
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-primary">
                    Modifica
                  </summary>
                  <div className="mt-2">
                    <InstructionForm
                      action={(formData) => updateInstruction(instr.id, formData)}
                      defaultValues={instr}
                      submitLabel="Aggiorna"
                    />
                  </div>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form nuova istruzione */}
      <Card>
        <CardHeader>
          <CardTitle>Aggiungi Istruzione</CardTitle>
        </CardHeader>
        <CardContent>
          <InstructionForm
            action={createInstruction}
            submitLabel="Aggiungi"
          />
        </CardContent>
      </Card>
    </div>
  );
}
