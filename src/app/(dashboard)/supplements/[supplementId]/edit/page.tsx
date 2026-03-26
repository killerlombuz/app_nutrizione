import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { SupplementForm } from "@/components/supplements/supplement-form";
import { updateSupplement } from "@/features/supplements/actions";
import { DeleteSupplementButton } from "@/components/supplements/delete-supplement-button";

export default async function EditSupplementPage({
  params,
}: {
  params: Promise<{ supplementId: string }>;
}) {
  const professionalId = await requireProfessionalId();
  const { supplementId } = await params;

  const supplement = await prisma.supplement.findFirst({
    where: { id: supplementId, professionalId },
  });

  if (!supplement) notFound();

  const boundAction = updateSupplement.bind(null, supplementId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Modifica Integratore</h1>
        <DeleteSupplementButton
          supplementId={supplementId}
          supplementName={supplement.name}
        />
      </div>
      <SupplementForm
        action={boundAction}
        defaultValues={supplement}
        submitLabel="Aggiorna Integratore"
      />
    </div>
  );
}
