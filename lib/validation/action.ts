import { z } from "zod";

export const actionSchema = z.object({
  type: z.string().min(1),
  targetType: z.string().min(1),
  targetId: z.string().min(1),
  label: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).optional()
});

export type ActionInput = z.infer<typeof actionSchema>;
