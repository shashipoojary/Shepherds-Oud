import { z } from "zod";

const optionalText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === null || value === undefined) return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  });

const optionalCount = z
  .union([z.number(), z.null()])
  .optional()
  .transform((value) => (value == null ? undefined : value));

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
  bedsTotal: optionalCount.pipe(
    z.number().int("Total beds must be a whole number (0 or more).").min(0, "Total beds cannot be negative.").optional()
  ),
  bedsOpen: optionalCount.pipe(
    z.number().int("Available beds must be a whole number (0 or more).").min(0, "Available beds cannot be negative.").optional()
  ),
  availabilityStatus: optionalText,
  waitlistText: optionalText,
  services: z.array(z.string()).default([]),
  careLevels: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  dementiaCapacity: optionalText,
  fundingTypes: z.array(z.string()).default([]),
  responseTimeHours: optionalCount.pipe(
    z
      .number()
      .int("Response time must be a whole number of hours.")
      .min(1, "Response time must be at least 1 hour.")
      .max(168, "Response time cannot be more than 168 hours (1 week).")
      .optional()
  ),
  visitAvailability: optionalText,
  priceMin: optionalCount.pipe(
    z.number().int().min(0, "Minimum price cannot be negative.").optional()
  ),
  priceMax: optionalCount.pipe(
    z.number().int().min(0, "Maximum price cannot be negative.").optional()
  )
});

export type ProviderProfileInput = z.infer<typeof providerProfileSchema>;
