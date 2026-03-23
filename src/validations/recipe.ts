import { z } from "zod";

export const recipeIngredientSchema = z.object({
  foodId: z.string().optional().or(z.literal("")),
  foodName: z.string().min(1, "Nome ingrediente obbligatorio"),
  grams: z.coerce.number().min(0).nullable().default(null),
});

export const recipeSchema = z.object({
  name: z.string().min(1, "Nome ricetta obbligatorio"),
  portions: z.coerce.number().min(0).nullable().default(null),
  notes: z.string().optional().or(z.literal("")),
  ingredients: z.array(recipeIngredientSchema).min(1, "Almeno un ingrediente"),
});

export type RecipeFormValues = z.infer<typeof recipeSchema>;
