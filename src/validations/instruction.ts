import { z } from "zod";

export const instructionSchema = z.object({
  category: z.string().min(1, "Categoria obbligatoria"),
  title: z.string().optional().or(z.literal("")),
  content: z.string().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type InstructionFormValues = z.infer<typeof instructionSchema>;
