import { FoodForm } from "@/components/foods/food-form";
import { createFood } from "@/features/foods/actions";

export default function NewFoodPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Nuovo Alimento</h1>
      <FoodForm action={createFood} submitLabel="Crea Alimento" />
    </div>
  );
}
