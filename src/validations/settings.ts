import { z } from "zod";

export const settingsSchema = z.object({
  name: z.string().min(1, "Nome obbligatorio"),
  title: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  logoUrl: z.string().optional().or(z.literal("")),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
