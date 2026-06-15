import { z } from "zod";

export const providerProfileSchema = z.object({
  name: z.string().min(2),
  type: z.string().min(1),
  city: z.string().optional(),
  province: z.string().optional(),
  description: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")).transform((value) => value || undefined),
  phone: z.string().optional(),
  website: z.string().optional(),
  bedsTotal: z.number().int().min(0).nullable().optional(),
  bedsOpen: z.number().int().min(0).nullable().optional(),
  availabilityStatus: z.string().optional(),
  waitlistText: z.string().optional(),
  services: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([])
});

export type ProviderProfileInput = z.infer<typeof providerProfileSchema>;
