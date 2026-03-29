import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const appointmentSchema = z.object({
  date: z.string().min(1, "Data obbligatoria").transform((v) => new Date(v)),
  startTime: z.string().regex(timeRegex, "Formato orario non valido (HH:mm)"),
  endTime: z.string().regex(timeRegex, "Formato orario non valido (HH:mm)"),
  patientId: z.string().optional().or(z.literal("")),
  title: z.string().optional().or(z.literal("")),
  type: z
    .enum(["prima_visita", "controllo", "consegna_piano", "altro"])
    .optional()
    .or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  status: z
    .enum(["scheduled", "completed", "cancelled", "no_show"])
    .default("scheduled"),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(["scheduled", "completed", "cancelled", "no_show"]),
});

export type AppointmentFormValues = z.input<typeof appointmentSchema>;
