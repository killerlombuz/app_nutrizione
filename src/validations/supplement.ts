import { z } from "zod";

export const supplementSchema = z.object({
  name: z.string().min(1, "Nome obbligatorio"),
  description: z.string().optional().or(z.literal("")),
  defaultDosage: z.string().optional().or(z.literal("")),
  timing: z.string().optional().or(z.literal("")),
});

export type SupplementFormValues = z.infer<typeof supplementSchema>;

export const patientSupplementSchema = z.object({
  supplementId: z.string().min(1, "Integratore obbligatorio"),
  dosage: z.string().optional().or(z.literal("")),
  timing: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type PatientSupplementFormValues = z.infer<typeof patientSupplementSchema>;
