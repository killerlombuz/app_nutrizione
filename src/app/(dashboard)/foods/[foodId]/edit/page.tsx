import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { FoodForm } from "@/components/foods/food-form";
import { updateFood } from "@/features/foods/actions";

export default async function EditFoodPage({
  params,
}: {
  params: Promise<{ foodId: string }>;
}) {
  const professionalId = await requireProfessionalId();
  const { foodId } = await params;

  const food = await prisma.food.findFirst({
    where: {
      id: foodId,
      OR: [{ professionalId }, { professionalId: null }],
    },
  });

  if (!food) notFound();

  // Only owner can edit
  if (food.professionalId && food.professionalId !== professionalId) notFound();

  const boundAction = updateFood.bind(null, foodId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Modifica Alimento</h1>
      <FoodForm action={boundAction} submitLabel="Aggiorna" defaultValues={food} />
    </div>
  );
}
