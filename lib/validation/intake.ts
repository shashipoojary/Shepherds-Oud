import { z } from "zod";

export const intakeSchema = z.object({
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  relationship: z.string().min(1),
  preferredArea: z.string().min(1),
  ageRange: z.string().min(1),
  careTypes: z.array(z.string()).min(1),
  urgency: z.string().min(1),
  budget: z.string().optional(),
  languages: z.array(z.string()).default([]),
  additionalNeeds: z.array(z.string()).default([]),
  notes: z.string().optional()
});

export type IntakeInput = z.infer<typeof intakeSchema>;
