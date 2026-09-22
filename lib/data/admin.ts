import { prisma } from "@/lib/core/db";
import { displayVisitAvailability } from "@/lib/config/content";
import { isProviderMatchable, providerVerificationLabel } from "@/lib/domain/provider-verification";
import { ensureAcceptedProviderInvitesHaveProfiles, expireStalePendingProviderInvites } from "@/lib/providers/invite";
import { summarizeProviderInviteEligibility } from "@/lib/providers/invite-access";
import { getProviderProfileMissingRequirements } from "@/lib/providers/completeness";
import {
  ADMIN_PAGE_SIZE,
  clampPage,
  clampPageSize,
  listCrisisCasesForAdminPaged,
  listCrisisReferralsForAdminPaged,
  pageMeta,
  type AdminPageMeta
} from "@/lib/data/admin-lists";
import { getCrisisOpsSummary, listDirectoryProvidersForAdmin } from "@/lib/data/crisis-ops";
import type { Prisma } from "@prisma/client";

export type AdminListKey = "cases" | "referrals" | "providers" | "waitlist";

export type AdminDashboardQuery = {
  pageSize?: number;
  casesPage?: number;
  referralsPage?: number;
  providersPage?: number;
  waitlistPage?: number;
  casesQ?: string;
  referralsQ?: string;
  providersQ?: string;
  waitlistQ?: string;
  /** Load only one list (for page/search changes). Still returns stats. */
  only?: AdminListKey;
};

const providerSelect = {
  id: true,
  name: true,
  type: true,
  area: true,
  city: true,
  province: true,
  description: true,
  contactName: true,
  email: true,
  phone: true,
  website: true,
  bedsOpen: true,
  bedsTotal: true,
  availabilityStatus: true,
  waitlistText: true,
  services: true,
  languages: true,
  careLevels: true,
  dementiaCapacity: true,
  fundingTypes: true,
  responseTimeHours: true,
  visitAvailability: true,
  priceMin: true,
  priceMax: true,
  adminNotes: true,
  verificationStatus: true,
  legalOrganisationName: true,
  kvkNumber: true,
  agbCode: true,
  wtzaStatus: true,
  roomTypes: true,
  accessibilityNotes: true,
  qualityInfo: true,
  preferredLocale: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.ProviderSelect;

function mapProvider(provider: Prisma.ProviderGetPayload<{ select: typeof providerSelect }>) {
  const profileMissingRequirements = getProviderProfileMissingRequirements(provider);
  const profileComplete = profileMissingRequirements.length === 0;
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
    bedsOpen: provider.bedsOpen,
    bedsTotal: provider.bedsTotal,
    availabilityStatus: provider.availabilityStatus,
    waitlistText: provider.waitlistText,
    services: provider.services,
    languages: provider.languages,
    careLevels: provider.careLevels,
    dementiaCapacity: provider.dementiaCapacity,
    fundingTypes: provider.fundingTypes,
    responseTimeHours: provider.responseTimeHours,
    visitAvailability: displayVisitAvailability(provider.visitAvailability),
    priceMin: provider.priceMin,
    priceMax: provider.priceMax,
    profileComplete,
    profileMissingRequirements,
    matchable: profileComplete && isProviderMatchable(provider.verificationStatus),
    verificationStatus: provider.verificationStatus,
    verificationLabel: providerVerificationLabel(provider.verificationStatus),
    legalOrganisationName: provider.legalOrganisationName,
    kvkNumber: provider.kvkNumber,
    agbCode: provider.agbCode,
    wtzaStatus: provider.wtzaStatus,
    roomTypes: provider.roomTypes,
    accessibilityNotes: provider.accessibilityNotes,
    qualityInfo: provider.qualityInfo,
    preferredLocale: provider.preferredLocale === "en" ? "en" : "nl",
    adminNotes: provider.adminNotes,
    createdAt: provider.createdAt.toLocaleDateString("en-GB"),
    createdAtIso: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toLocaleDateString("en-GB"),
    updatedAtIso: provider.updatedAt.toISOString()
  };
}

async function listProvidersPaged(page = 1, pageSize = ADMIN_PAGE_SIZE, q = "") {
  const query = q.trim();
  const where: Prisma.ProviderWhereInput = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
          { contactName: { contains: query, mode: "insensitive" } }
        ]
      }
    : {};

  const size = clampPageSize(pageSize);
  const requestedPage = clampPage(page);
  const skip = (requestedPage - 1) * size;

  const [total, rows] = await Promise.all([
    prisma.provider.count({ where }),
    prisma.provider.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: size,
      select: providerSelect
    })
  ]);

  return {
    items: rows.map(mapProvider),
    ...pageMeta(requestedPage, size, total)
  };
}

async function listWaitlistPaged(page = 1, pageSize = ADMIN_PAGE_SIZE, q = "") {
  const query = q.trim();
  const where: Prisma.WaitlistEntryWhereInput = query
    ? {
        OR: [
          { contactName: { contains: query, mode: "insensitive" } },
          { facilityName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } }
        ]
      }
    : {};

  const size = clampPageSize(pageSize);
  const requestedPage = clampPage(page);
  const skip = (requestedPage - 1) * size;

  const [total, waitlist] = await Promise.all([
    prisma.waitlistEntry.count({ where }),
    prisma.waitlistEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: size,
      select: {
        id: true,
        type: true,
        contactName: true,
        facilityName: true,
        email: true,
        phone: true,
        city: true,
        province: true,
        message: true,
        relationship: true,
        ageRange: true,
        careTypes: true,
        facilityType: true,
        bedsTotal: true,
        services: true,
        registrationNumber: true,
        registrationVerified: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })
  ]);

  const ids = waitlist.map((entry) => entry.id);
  const providerInvites = ids.length
    ? await prisma.providerInvite.findMany({
        where: { waitlistEntryId: { in: ids } },
        select: { waitlistEntryId: true, status: true, expiresAt: true }
      })
    : [];

  const invitesByWaitlistEntry = new Map<string, Array<{ status: string; expiresAt: Date }>>();
  for (const invite of providerInvites) {
    if (!invite.waitlistEntryId) continue;
    const current = invitesByWaitlistEntry.get(invite.waitlistEntryId) || [];
    current.push({ status: invite.status, expiresAt: invite.expiresAt });
    invitesByWaitlistEntry.set(invite.waitlistEntryId, current);
  }

  const meta = pageMeta(requestedPage, size, total);

  return {
    items: waitlist.map((entry) => {
      const inviteEligibility = summarizeProviderInviteEligibility(
        entry,
        invitesByWaitlistEntry.get(entry.id) || []
      );

      return {
        id: entry.id,
        type: entry.type,
        contactName: entry.contactName,
        name: entry.type === "FACILITY" ? entry.facilityName || entry.contactName : entry.contactName,
        email: entry.email,
        phone: entry.phone || null,
        city: entry.city,
        province: entry.province,
        message: entry.message,
        relationship: entry.relationship,
        ageRange: entry.ageRange,
        careTypes: entry.careTypes,
        facilityName: entry.facilityName,
        facilityType: entry.facilityType,
        bedsTotal: entry.bedsTotal,
        services: entry.services,
        registrationNumber: entry.registrationNumber,
        registrationVerified: entry.registrationVerified,
        location: [entry.city, entry.province].filter(Boolean).join(", ") || "—",
        status: entry.status,
        createdAt: entry.createdAt.toLocaleDateString("en-GB"),
        createdAtIso: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toLocaleDateString("en-GB"),
        updatedAtIso: entry.updatedAt.toISOString(),
        canSendProviderInvite: inviteEligibility.canSend,
        providerInviteAttemptsUsed: inviteEligibility.attemptsUsed,
        providerInviteAttemptsRemaining: inviteEligibility.attemptsRemaining,
        hasActivePendingProviderInvite: inviteEligibility.hasActivePendingInvite,
        providerInviteLockReason: inviteEligibility.lockReason || null
      };
    }),
    page: meta.page,
    pageSize: meta.pageSize,
    total: meta.total
  };
}

export async function getAdminDashboardData(query: AdminDashboardQuery = {}) {
  // Never block reads on invite maintenance.
  void expireStalePendingProviderInvites().catch(() => {});
  void ensureAcceptedProviderInvitesHaveProfiles().catch(() => {});

  const pageSize = query.pageSize || ADMIN_PAGE_SIZE;
  const only = query.only;

  const loadCases = !only || only === "cases";
  const loadReferrals = !only || only === "referrals";
  const loadProviders = !only || only === "providers";
  const loadWaitlist = !only || only === "waitlist";
  const loadReferralShell = !only || only === "referrals";

  const [
    providerCount,
    crisisSummary,
    directoryList,
    providerLinkOptions,
    casesPage,
    referralsPage,
    providersPage,
    waitlistPage
  ] = await Promise.all([
    prisma.provider.count(),
    getCrisisOpsSummary(),
    loadReferralShell ? listDirectoryProvidersForAdmin() : Promise.resolve([]),
    loadReferralShell
      ? prisma.provider.findMany({
          orderBy: { name: "asc" },
          take: 500,
          select: { id: true, name: true, email: true }
        })
      : Promise.resolve([]),
    loadCases
      ? listCrisisCasesForAdminPaged(query.casesPage || 1, pageSize, query.casesQ || "")
      : Promise.resolve(null),
    loadReferrals
      ? listCrisisReferralsForAdminPaged(query.referralsPage || 1, pageSize, query.referralsQ || "")
      : Promise.resolve(null),
    loadProviders ? listProvidersPaged(query.providersPage || 1, pageSize, query.providersQ || "") : Promise.resolve(null),
    loadWaitlist ? listWaitlistPaged(query.waitlistPage || 1, pageSize, query.waitlistQ || "") : Promise.resolve(null)
  ]);

  const emptyPage = (page = 1): AdminPageMeta & { items: never[] } => ({
    items: [],
    page,
    pageSize,
    total: 0
  });

  return {
    stats: [
      [String(crisisSummary.activeCaseCount), "Active triage cases"],
      [String(crisisSummary.pendingReferrals), "Open referrals"],
      [String(crisisSummary.directoryCount), "Directory listings"],
      [String(providerCount), "Provider accounts"]
    ] as Array<[string, string]>,
    directoryList,
    providerLinkOptions,
    crisisCases: casesPage?.items ?? [],
    crisisReferrals: referralsPage?.items ?? [],
    providerList: providersPage?.items ?? [],
    waitlist: waitlistPage?.items ?? [],
    pagination: {
      cases: casesPage
        ? { page: casesPage.page, pageSize: casesPage.pageSize, total: casesPage.total }
        : emptyPage(query.casesPage || 1),
      referrals: referralsPage
        ? { page: referralsPage.page, pageSize: referralsPage.pageSize, total: referralsPage.total }
        : emptyPage(query.referralsPage || 1),
      providers: providersPage
        ? { page: providersPage.page, pageSize: providersPage.pageSize, total: providersPage.total }
        : emptyPage(query.providersPage || 1),
      waitlist: waitlistPage
        ? { page: waitlistPage.page, pageSize: waitlistPage.pageSize, total: waitlistPage.total }
        : emptyPage(query.waitlistPage || 1)
    } satisfies Record<AdminListKey, AdminPageMeta>
  };
}

export type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboardData>>;
