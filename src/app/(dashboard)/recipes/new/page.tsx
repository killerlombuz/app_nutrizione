import { RecipeFormClient } from "@/components/recipes/recipe-form-client";
import { createRecipe } from "@/features/recipes/actions";

export default function NewRecipePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Nuova Ricetta</h1>
      <RecipeFormClient action={createRecipe} submitLabel="Crea Ricetta" />
    </div>
  );
}
