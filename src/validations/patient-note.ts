import { z } from "zod";

export const patientNoteSchema = z.object({
  content: z.string().min(1, "Il contenuto è obbligatorio").max(2000),
  category: z.string().optional().or(z.literal("")),
});

export type PatientNoteFormValues = z.input<typeof patientNoteSchema>;
