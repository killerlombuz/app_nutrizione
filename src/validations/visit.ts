import { z } from "zod";

const optionalFloat = z.coerce.number().optional().or(z.literal(""));

export const visitSchema = z.object({
  date: z.string().min(1, "Data obbligatoria"),
  weightKg: z.coerce.number().positive("Peso deve essere positivo"),
  formulaUsed: z.string().default("f_media"),

  // Plicometria (7 siti)
  plicChest: optionalFloat,
  plicTricep: optionalFloat,
  plicAxillary: optionalFloat,
  plicSubscapular: optionalFloat,
  plicSuprailiac: optionalFloat,
  plicAbdominal: optionalFloat,
  plicThigh: optionalFloat,

  // Circonferenze (11 siti)
  circNeck: optionalFloat,
  circChest: optionalFloat,
  circArmRelaxed: optionalFloat,
  circArmFlexed: optionalFloat,
  circWaist: optionalFloat,
  circLowerAbdomen: optionalFloat,
  circHips: optionalFloat,
  circUpperThigh: optionalFloat,
  circMidThigh: optionalFloat,
  circLowerThigh: optionalFloat,
  circCalf: optionalFloat,
});

export type VisitFormValues = z.input<typeof visitSchema>;
