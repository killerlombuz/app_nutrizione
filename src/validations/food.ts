import { z } from "zod";

export const foodSchema = z.object({
  name: z.string().min(1, "Nome obbligatorio"),
  category: z.string().optional().or(z.literal("")),
  kcalPer100g: z.coerce.number().min(0).default(0),
  fatG: z.coerce.number().min(0).default(0),
  satFatG: z.coerce.number().min(0).default(0),
  carbG: z.coerce.number().min(0).default(0),
  sugarG: z.coerce.number().min(0).default(0),
  proteinG: z.coerce.number().min(0).default(0),
  fiberG: z.coerce.number().min(0).default(0),
  isFodmap: z.string().optional().transform((v) => v === "on"),
  isNickel: z.string().optional().transform((v) => v === "on"),
  isGlutenFree: z.string().optional().transform((v) => v === "on"),
  isLactoseFree: z.string().optional().transform((v) => v === "on"),
  notes: z.string().optional().or(z.literal("")),
});

export type FoodFormValues = z.input<typeof foodSchema>;
