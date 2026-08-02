import { z } from "zod";
import type { Locale } from "@/lib/i18n/config";
import { productUi } from "@/lib/i18n/ui";

export function waitlistSchemaFor(locale: Locale = "nl") {
  const v = productUi(locale).validation;

  const baseFields = {
    contactName: z.string().min(2, v.tooShort).max(120),
    email: z.string().email(v.invalidEmail).max(254),
    phone: z.string().min(6, v.tooShort).max(40).optional(),
    city: z.string().min(1, v.required).max(120).optional(),
    province: z.string().min(1, v.required).max(120).optional(),
    message: z.string().max(2000).optional()
  };

  const familyWaitlistSchema = z.object({
    type: z.literal("FAMILY"),
    ...baseFields,
    relationship: z.string().min(1, v.required).max(120).optional(),
    ageRange: z.string().min(1, v.required).max(80).optional(),
    careTypes: z.array(z.string().max(80)).max(20).default([])
  });

  const facilityWaitlistSchema = z.object({
    type: z.literal("FACILITY"),
    ...baseFields,
    facilityName: z.string().min(2, v.tooShort).max(160),
    facilityType: z.string().min(1, v.required).max(120),
    bedsTotal: z.coerce.number().int().min(0).max(100_000).optional(),
    services: z.array(z.string().max(80)).max(40).default([]),
    registrationNumber: z.string().min(4, v.registrationNumber).max(64)
  });

  return z.discriminatedUnion("type", [familyWaitlistSchema, facilityWaitlistSchema]);
}

/** Default NL schema — prefer `waitlistSchemaFor(locale)` at request boundaries. */
export const waitlistSchema = waitlistSchemaFor("nl");
