import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { DeleteRecipeButton } from "@/components/recipes/delete-recipe-button";
import { updateRecipe } from "@/features/recipes/actions";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const professionalId = await requireProfessionalId();
  const { recipeId } = await params;

  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, professionalId },
    include: {
      ingredients: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!recipe) notFound();

  const defaultValues = {
    name: recipe.name,
    portions: recipe.portions,
    notes: recipe.notes ?? "",
    ingredients: recipe.ingredients.map((i) => ({
      foodId: i.foodId ?? "",
      foodName: i.foodName ?? "",
      grams: i.grams,
    })),
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Modifica Ricetta</h1>
        <DeleteRecipeButton recipeId={recipeId} recipeName={recipe.name} />
      </div>
      <RecipeForm
        action={(data) => updateRecipe(recipeId, data)}
        defaultValues={defaultValues}
        submitLabel="Aggiorna Ricetta"
      />
    </div>
  );
}
