import { z } from "zod";
import type { Locale } from "@/lib/i18n/config";
import { productUi } from "@/lib/i18n/ui";

export function waitlistSchemaFor(locale: Locale = "nl") {
  const v = productUi(locale).validation;

  const baseFields = {
    contactName: z.string().min(2, v.tooShort),
    email: z.string().email(v.invalidEmail),
    phone: z.string().min(6, v.tooShort).optional(),
    city: z.string().min(1, v.required).optional(),
    province: z.string().min(1, v.required).optional(),
    message: z.string().optional()
  };

  const familyWaitlistSchema = z.object({
    type: z.literal("FAMILY"),
    ...baseFields,
    relationship: z.string().min(1, v.required).optional(),
    ageRange: z.string().min(1, v.required).optional(),
    careTypes: z.array(z.string()).default([])
  });

  const facilityWaitlistSchema = z.object({
    type: z.literal("FACILITY"),
    ...baseFields,
    facilityName: z.string().min(2, v.tooShort),
    facilityType: z.string().min(1, v.required),
    bedsTotal: z.coerce.number().int().min(0).optional(),
    services: z.array(z.string()).default([]),
    registrationNumber: z.string().min(4, v.registrationNumber).max(64)
  });

  return z.discriminatedUnion("type", [familyWaitlistSchema, facilityWaitlistSchema]);
}

/** Default NL schema — prefer `waitlistSchemaFor(locale)` at request boundaries. */
export const waitlistSchema = waitlistSchemaFor("nl");
