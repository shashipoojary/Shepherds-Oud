import { z } from "zod";
import { PROVIDER_VERIFICATION_STATUSES } from "@/lib/domain/provider-verification";

const optionalText = z.string().max(500).nullable().optional();
const optionalLongText = z.string().max(5000).nullable().optional();

export const adminProviderNotesSchema = z.object({
  adminNotes: optionalLongText,
  verificationStatus: z.enum(PROVIDER_VERIFICATION_STATUSES).optional(),
  legalOrganisationName: optionalText,
  kvkNumber: z.string().max(64).nullable().optional(),
  agbCode: z.string().max(64).nullable().optional(),
  wtzaStatus: optionalText,
  roomTypes: z.array(z.string().min(1).max(100)).max(20).optional()
});

export type AdminProviderNotesInput = z.infer<typeof adminProviderNotesSchema>;
