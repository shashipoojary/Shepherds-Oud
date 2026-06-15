import { z } from "zod";

const baseFields = {
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6).optional(),
  city: z.string().min(1).optional(),
  province: z.string().min(1).optional(),
  message: z.string().optional()
};

export const familyWaitlistSchema = z.object({
  type: z.literal("FAMILY"),
  ...baseFields,
  relationship: z.string().min(1).optional(),
  ageRange: z.string().min(1).optional(),
  careTypes: z.array(z.string()).default([])
});

export const facilityWaitlistSchema = z.object({
  type: z.literal("FACILITY"),
  ...baseFields,
  facilityName: z.string().min(2),
  facilityType: z.string().min(1),
  bedsTotal: z.coerce.number().int().min(0).optional(),
  services: z.array(z.string()).default([])
});

export const waitlistSchema = z.discriminatedUnion("type", [familyWaitlistSchema, facilityWaitlistSchema]);
