import { SupplementForm } from "@/components/supplements/supplement-form";
import { createSupplement } from "@/features/supplements/actions";

export default function NewSupplementPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Nuovo Integratore</h1>
      <SupplementForm action={createSupplement} submitLabel="Crea Integratore" />
    </div>
  );
}
