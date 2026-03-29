import { z } from "zod";

export const foodDiarySchema = z.object({
  date: z.string().min(1, "Data obbligatoria"),
  mealType: z.enum([
    "COLAZIONE",
    "SPUNTINO_MATTINA",
    "PRANZO",
    "SPUNTINO_POMERIGGIO",
    "CENA",
    "SPUNTINO_SERA",
  ]),
  description: z.string().min(1, "Descrizione obbligatoria").max(1000),
  imageUrl: z.string().url("URL immagine non valido").optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type FoodDiaryFormValues = z.input<typeof foodDiarySchema>;
