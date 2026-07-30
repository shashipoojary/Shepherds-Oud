import {
  filterProviderInquiriesByTab,
  providerInquiryStatusLabel
} from "@/lib/domain/match-status";
import type { Locale } from "@/lib/i18n/config";

export type InsightInquiry = {
  id: string;
  status: string;
  updatedAt: string;
  intake: { contactName: string };
};

export type ProviderInquiryInsights = {
  actionNeeded: number;
  ongoing: number;
  closed: number;
  total: number;
  accepted: number;
  declined: number;
  /** Approximate: accepted / (accepted + declined) on current rows. Null when neither exists. */
  acceptanceRatePercent: number | null;
  recent: Array<{
    id: string;
    familyName: string;
    status: string;
    statusLabel: string;
    updatedAt: string;
  }>;
};

const RECENT_LIMIT = 5;

export function buildProviderInquiryInsights(
  inquiries: InsightInquiry[],
  locale: Locale = "nl",
  recentLimit: number = RECENT_LIMIT
): ProviderInquiryInsights {
  const actionNeeded = filterProviderInquiriesByTab(inquiries, "new").length;
  const ongoing = filterProviderInquiriesByTab(inquiries, "ongoing").length;
  const closed = filterProviderInquiriesByTab(inquiries, "closed").length;

  let accepted = 0;
  let declined = 0;
  for (const item of inquiries) {
    if (item.status === "ACCEPTED") accepted += 1;
    if (item.status === "DECLINED") declined += 1;
  }

  const decided = accepted + declined;
  const acceptanceRatePercent = decided > 0 ? Math.round((accepted / decided) * 100) : null;

  const recent = [...inquiries]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, recentLimit)
    .map((item) => ({
      id: item.id,
      familyName: item.intake.contactName,
      status: item.status,
      statusLabel: providerInquiryStatusLabel(item.status, locale),
      updatedAt: item.updatedAt
    }));

  return {
    actionNeeded,
    ongoing,
    closed,
    total: inquiries.length,
    accepted,
    declined,
    acceptanceRatePercent,
    recent
  };
}
