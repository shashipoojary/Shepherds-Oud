import { z } from "zod";
import type { Locale } from "@/lib/i18n/config";
import { productUi } from "@/lib/i18n/ui";

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

export function providerProfileSchemaFor(locale: Locale = "nl") {
  const v = productUi(locale).validation;

  return z.object({
    name: z.string().trim().min(2, v.facilityNameMin),
    type: z.string().min(1, v.required),
    city: optionalText,
    province: optionalText,
    description: optionalText,
    contactName: optionalText,
    email: z
      .union([z.string().email(v.invalidEmail), z.literal(""), z.null()])
      .optional()
      .transform((value) => (value && value.length ? value : undefined)),
    phone: optionalText,
    website: optionalText,
    bedsTotal: optionalCount.pipe(
      z.number().int(v.bedsWhole).min(0, v.bedsNegative).optional()
    ),
    bedsOpen: optionalCount.pipe(
      z.number().int(v.bedsOpenWhole).min(0, v.bedsOpenNegative).optional()
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
        .int(v.responseTimeWhole)
        .min(1, v.responseTimeMin)
        .max(168, v.responseTimeMax)
        .optional()
    ),
    visitAvailability: optionalText,
    priceMin: optionalCount.pipe(z.number().int().min(0, v.priceMinNegative).optional()),
    priceMax: optionalCount.pipe(z.number().int().min(0, v.priceMaxNegative).optional())
  });
}

/** Default NL schema — prefer `providerProfileSchemaFor(locale)` at request boundaries. */
export const providerProfileSchema = providerProfileSchemaFor("nl");

export type ProviderProfileInput = z.infer<ReturnType<typeof providerProfileSchemaFor>>;
