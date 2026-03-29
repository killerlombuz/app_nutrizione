import { z } from "zod";

const optionalPositiveNumber = (max: number) =>
  z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().positive().max(max).optional().nullable()
  );

export const patientGoalsSchema = z.object({
  targetWeightKg: optionalPositiveNumber(300),
  targetBodyFatPct: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().min(3).max(60).optional().nullable()
  ),
  targetNotes: z.string().max(500).optional().or(z.literal("")),
});

export type PatientGoalsFormValues = z.input<typeof patientGoalsSchema>;
