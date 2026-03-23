import { z } from "zod";

export const patientSchema = z.object({
  name: z.string().min(1, "Nome obbligatorio"),
  birthDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  heightCm: z.coerce.number().positive("Altezza deve essere positiva").optional().or(z.literal("")),
  gender: z.enum(["M", "F"]).optional().or(z.literal("")),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type PatientFormValues = z.input<typeof patientSchema>;
