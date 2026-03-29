import { z } from "zod";

export const recipeIngredientSchema = z.object({
  foodId: z.string().optional().or(z.literal("")),
  foodName: z.string().min(1, "Nome ingrediente obbligatorio"),
  grams: z.number().min(0).nullable().default(null),
});

export const recipeDifficultySchema = z.enum(["facile", "media", "avanzata"]);

export const recipeSchema = z.object({
  name: z.string().min(1, "Nome ricetta obbligatorio"),
  portions: z.number().min(0).nullable().default(null),
  notes: z.string().optional().or(z.literal("")),
  imageUrl: z.string().url().nullable().optional(),
  prepTimeMin: z.number().int().positive().nullable().optional(),
  cookTimeMin: z.number().int().positive().nullable().optional(),
  difficulty: recipeDifficultySchema.nullable().optional(),
  instructions: z.string().optional().or(z.literal("")),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  isLactoseFree: z.boolean().default(false),
  isLowFodmap: z.boolean().default(false),
  ingredients: z.array(recipeIngredientSchema).min(1, "Almeno un ingrediente"),
});

export type RecipeFormValues = z.infer<typeof recipeSchema>;
