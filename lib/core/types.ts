export type ProviderTag = {
  label: string;
  type: "avail" | "wait" | "service" | "lang";
};

export type ProviderMatch = {
  id: string;
  name: string;
  type: string;
  area: string;
  match: number;
  matchId?: string;
  matchStatus?: string;
  familyFacingReason?: string | null;
  availability: string;
  action: string;
  tags: ProviderTag[];
  meta: string[];
  description: string;
  details: Record<string, string>;
  contact: string[];
  availabilityUpdatedAt?: string;
  verificationStatus?: string;
  verificationBadge?: string | null;
  services?: string[];
  careLevels?: string[];
  languages?: string[];
  fundingTypes?: string[];
  roomTypes?: string[];
  qualityInfo?: string | null;
  accessibilityNotes?: string | null;
  waitEstimate?: string | null;
  /** True when waitEstimate is a fresh provider-reported day range (not Care Guide fallback). */
  waitEstimateIsFresh?: boolean;
  responseTimeHours?: number | null;
  proposedStartsAt?: string | null;
  proposedEndsAt?: string | null;
  alternateStartsAt?: string | null;
  alternateEndsAt?: string | null;
  schedulingStatus?: string | null;
};
