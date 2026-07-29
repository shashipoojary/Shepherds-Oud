import { normalizeIntakeStatus } from "@/lib/domain/intake-workflow";
import type { Provider } from "@prisma/client";

export type SafeProvider = {
  id: string;
  name: string;
  type: string;
  area: string;
  city: string | null;
  province: string | null;
  description: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  bedsTotal: number | null;
  bedsOpen: number | null;
  availabilityStatus: string | null;
  waitlistText: string | null;
  waitEstimateMinDays: number | null;
  waitEstimateMaxDays: number | null;
  waitEstimateUpdatedAt: string | null;
  services: string[];
  languages: string[];
  careLevels: string[];
  dementiaCapacity: string | null;
  fundingTypes: string[];
  responseTimeHours: number | null;
  visitAvailability: string | null;
  priceMin: number | null;
  priceMax: number | null;
  verificationStatus: string;
  legalOrganisationName: string | null;
  kvkNumber: string | null;
  agbCode: string | null;
  wtzaStatus: string | null;
  roomTypes: string[];
  accessibilityNotes: string | null;
  qualityInfo: string | null;
};

type ProviderInquiryIntake = {
  id: string;
  contactName: string;
  preferredArea: string;
  careTypes: string[];
  urgency: string;
  ageRange: string;
  phone: string;
  email: string;
  status: string;
  visitScheduledAt: Date | null;
  visitType: string | null;
  visitProviderName: string | null;
  visitNotes: string | null;
};

type ProviderInquiryMatch = {
  id: string;
  intakeId: string;
  score: number;
  status: string;
  notes: string | null;
  declineReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  proposedStartsAt: Date | null;
  proposedEndsAt: Date | null;
  alternateStartsAt: Date | null;
  alternateEndsAt: Date | null;
  confirmedStartsAt: Date | null;
  confirmedEndsAt: Date | null;
  schedulingStatus: string | null;
  schedulingMode: string | null;
  schedulingExpiresAt: Date | null;
  intake: ProviderInquiryIntake;
};

export type SafeProviderInquiry = {
  id: string;
  intakeId: string;
  score: number;
  status: string;
  notes: string | null;
  declineReason: string | null;
  createdAt: string;
  updatedAt: string;
  proposedStartsAt: string | null;
  proposedEndsAt: string | null;
  alternateStartsAt: string | null;
  alternateEndsAt: string | null;
  confirmedStartsAt: string | null;
  confirmedEndsAt: string | null;
  schedulingStatus: string | null;
  schedulingMode: string | null;
  schedulingExpiresAt: string | null;
  intake: {
    contactName: string;
    preferredArea: string;
    careTypes: string[];
    urgency: string;
    ageRange: string;
    phone: string;
    email: string;
    status: string;
    visitScheduledAt: string | null;
    visitType: string | null;
    visitProviderName: string | null;
    visitNotes: string | null;
  };
};

export function toSafeProvider(provider: Provider | null): SafeProvider | null {
  if (!provider) {
    return null;
  }

  return {
    id: provider.id,
    name: provider.name,
    type: provider.type,
    area: provider.area,
    city: provider.city,
    province: provider.province,
    description: provider.description,
    contactName: provider.contactName,
    email: provider.email,
    phone: provider.phone,
    website: provider.website,
    bedsTotal: provider.bedsTotal,
    bedsOpen: provider.bedsOpen,
    availabilityStatus: provider.availabilityStatus,
    waitlistText: provider.waitlistText,
    waitEstimateMinDays: provider.waitEstimateMinDays,
    waitEstimateMaxDays: provider.waitEstimateMaxDays,
    waitEstimateUpdatedAt: provider.waitEstimateUpdatedAt
      ? provider.waitEstimateUpdatedAt.toISOString()
      : null,
    services: provider.services,
    languages: provider.languages,
    careLevels: provider.careLevels,
    dementiaCapacity: provider.dementiaCapacity,
    fundingTypes: provider.fundingTypes,
    responseTimeHours: provider.responseTimeHours,
    visitAvailability: provider.visitAvailability,
    priceMin: provider.priceMin,
    priceMax: provider.priceMax,
    verificationStatus: provider.verificationStatus,
    legalOrganisationName: provider.legalOrganisationName,
    kvkNumber: provider.kvkNumber,
    agbCode: provider.agbCode,
    wtzaStatus: provider.wtzaStatus,
    roomTypes: provider.roomTypes,
    accessibilityNotes: provider.accessibilityNotes,
    qualityInfo: provider.qualityInfo
  };
}

export function toSafeProviderInquiry(match: ProviderInquiryMatch): SafeProviderInquiry {
  return {
    id: match.id,
    intakeId: match.intakeId,
    score: match.score,
    status: normalizeIntakeStatus(match.intake.status) === "CLOSED" ? "CLOSED" : match.status,
    notes: match.notes,
    declineReason: match.declineReason,
    createdAt: match.createdAt.toISOString(),
    updatedAt: match.updatedAt.toISOString(),
    proposedStartsAt: match.proposedStartsAt?.toISOString() ?? null,
    proposedEndsAt: match.proposedEndsAt?.toISOString() ?? null,
    alternateStartsAt: match.alternateStartsAt?.toISOString() ?? null,
    alternateEndsAt: match.alternateEndsAt?.toISOString() ?? null,
    confirmedStartsAt: match.confirmedStartsAt?.toISOString() ?? null,
    confirmedEndsAt: match.confirmedEndsAt?.toISOString() ?? null,
    schedulingStatus: match.schedulingStatus,
    schedulingMode: match.schedulingMode,
    schedulingExpiresAt: match.schedulingExpiresAt?.toISOString() ?? null,
    intake: {
      contactName: match.intake.contactName,
      preferredArea: match.intake.preferredArea,
      careTypes: match.intake.careTypes,
      urgency: match.intake.urgency,
      ageRange: match.intake.ageRange,
      phone: match.intake.phone,
      email: match.intake.email,
      status: match.intake.status,
      visitScheduledAt: match.intake.visitScheduledAt?.toISOString() ?? null,
      visitType: match.intake.visitType,
      visitProviderName: match.intake.visitProviderName,
      visitNotes: null
    }
  };
}
