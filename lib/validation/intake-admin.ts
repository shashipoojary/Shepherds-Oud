import { z } from "zod";
import { CARE_PATHWAYS } from "@/lib/domain/care-pathways";
import { INTAKE_STATUSES } from "@/lib/domain/intake-workflow";

export const adminIntakeUpdateSchema = z.object({
  status: z.enum(INTAKE_STATUSES).optional(),
  careGuideId: z.string().nullable().optional(),
  carePathway: z.enum(CARE_PATHWAYS).optional(),
  assessmentNotes: z.string().max(5000).optional(),
  carePlanSummary: z.string().max(5000).optional(),
  visitScheduledAt: z.string().datetime().nullable().optional(),
  visitType: z.enum(["VISIT", "CALLBACK"]).nullable().optional(),
  visitProviderName: z.string().max(200).nullable().optional(),
  visitNotes: z.string().max(2000).nullable().optional()
});

export type AdminIntakeUpdate = z.infer<typeof adminIntakeUpdateSchema>;
