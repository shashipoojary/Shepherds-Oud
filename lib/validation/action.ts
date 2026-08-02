import { z } from "zod";

export const actionSchema = z.object({
  type: z.string().min(1).max(80),
  targetType: z.string().min(1).max(80),
  targetId: z.string().min(1).max(120),
  label: z.string().min(1).max(200),
  payload: z.record(z.string().max(80), z.unknown()).optional()
});

export type ActionInput = z.infer<typeof actionSchema>;
