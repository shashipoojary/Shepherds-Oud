import { z } from "zod";

const optionalText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === null || value === undefined) return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  });

export const providerProfileSchema = z.object({
  name: z.string().trim().min(2, "Facility name must be at least 2 characters."),
  type: z.string().min(1),
  city: optionalText,
  province: optionalText,
  description: optionalText,
  contactName: optionalText,
  email: z
    .union([z.string().email(), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value && value.length ? value : undefined)),
  phone: optionalText,
  website: optionalText,
  bedsTotal: z.number().int().min(0).nullable().optional(),
  bedsOpen: z.number().int().min(0).nullable().optional(),
  availabilityStatus: optionalText,
  waitlistText: optionalText,
  services: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([])
});

export type ProviderProfileInput = z.infer<typeof providerProfileSchema>;
