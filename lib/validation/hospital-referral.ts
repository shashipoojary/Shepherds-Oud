import { z } from "zod";
import type { Locale } from "@/lib/i18n/config";
import { productUi } from "@/lib/i18n/ui";

/** Minimal hospital referral — maps onto Intake with sensible defaults for unused fields. */
export function hospitalReferralSchemaFor(locale: Locale = "nl") {
  const v = productUi(locale).validation;

  return z
    .object({
      contactName: z.string().trim().min(2, v.required),
      email: z.string().trim().email(v.invalidEmail),
      phone: z.string().trim().min(6, v.required),
      preferredArea: z.string().trim().min(2, v.required),
      urgency: z.string().trim().min(1, v.required),
      careTypes: z.array(z.string().min(1)).min(1, v.required),
      ageRange: z.string().trim().optional(),
      notes: z.string().trim().max(2000).optional(),
      consentAccepted: z.literal(true).optional()
    })
    .superRefine((data, ctx) => {
      if (data.consentAccepted !== true) {
        ctx.addIssue({ code: "custom", path: ["consentAccepted"], message: v.consentRequired });
      }
    });
}

export type HospitalReferralInput = z.infer<ReturnType<typeof hospitalReferralSchemaFor>>;
