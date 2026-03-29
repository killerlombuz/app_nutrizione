import { z } from "zod";

export const messageSchema = z.object({
  content: z.string().min(1, "Il messaggio non può essere vuoto").max(2000),
});

export type MessageFormValues = z.infer<typeof messageSchema>;
