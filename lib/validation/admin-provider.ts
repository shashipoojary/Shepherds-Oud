import { z } from "zod";

export const adminProviderNotesSchema = z.object({
  adminNotes: z.string().max(5000).nullable()
});

export type AdminProviderNotesInput = z.infer<typeof adminProviderNotesSchema>;
