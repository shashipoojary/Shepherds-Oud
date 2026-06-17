import { z } from "zod";

export const createMatchSchema = z.object({
  intakeId: z.string().min(1),
  providerId: z.string().min(1),
  score: z.number().int().min(0).max(100),
  notes: z.string().optional()
});

export const updateMatchSchema = z.object({
  status: z.enum([
    "SUGGESTED",
    "CONTACTED",
    "VISIT_REQUESTED",
    "CALLBACK_REQUESTED",
    "ACCEPTED",
    "DECLINED",
    "PLACED",
    "CLOSED"
  ]),
  notes: z.string().optional(),
  intakeId: z.string().min(1).optional()
});
