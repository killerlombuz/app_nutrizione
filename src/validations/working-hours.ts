import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const workingHoursEntrySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, "Formato orario non valido (HH:mm)"),
  endTime: z.string().regex(timeRegex, "Formato orario non valido (HH:mm)"),
  slotDuration: z.coerce.number().int().min(15).max(120).default(30),
  isActive: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "on")
    .or(z.boolean()),
});

export const workingHoursBulkSchema = z.array(workingHoursEntrySchema);

export type WorkingHoursEntryValues = z.input<typeof workingHoursEntrySchema>;
