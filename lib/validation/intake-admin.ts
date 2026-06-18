import { z } from "zod";
import { CARE_PATHWAYS } from "@/lib/care-pathways";
import { INTAKE_STATUSES } from "@/lib/intake-workflow";

export const adminIntakeUpdateSchema = z.object({
  status: z.enum(INTAKE_STATUSES).optional(),
  careGuideId: z.string().nullable().optional(),
  carePathway: z.enum(CARE_PATHWAYS).optional(),
  assessmentNotes: z.string().max(5000).optional(),
  carePlanSummary: z.string().max(5000).optional()
});

export type AdminIntakeUpdate = z.infer<typeof adminIntakeUpdateSchema>;
