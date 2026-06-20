import { z } from "zod";

const optionalText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === null || value === undefined) return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  });

export const intakeSchema = z.object({
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  relationship: z.string().min(1),
  preferredArea: z.string().min(1),
  ageRange: z.string().min(1),
  careTypes: z.array(z.string()).min(1),
  urgency: z.string().min(1),
  budget: optionalText,
  languages: z.array(z.string()).default([]),
  additionalNeeds: z.array(z.string()).default([]),
  livingSituation: optionalText,
  moveInTimeline: optionalText,
  mobility: optionalText,
  dementiaNeeds: optionalText,
  hospitalDischargeDate: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => (value && value.trim().length ? value.trim() : undefined)),
  decisionMakerName: optionalText,
  decisionMakerRelationship: optionalText,
  emotionalSupportNeeds: z.array(z.string()).default([]),
  supportTypes: z.array(z.string()).default([]),
  notes: optionalText
});

export type IntakeInput = z.infer<typeof intakeSchema>;
