import { filterProviderInquiriesByTab, type ProviderInquiryTab } from "@/lib/domain/match-status";

const STORAGE_KEY = "shepherds-oud:provider-inquiry-tab-seen";

type SeenMap = Record<ProviderInquiryTab, string>;

type ProviderInquiryActivity = {
  createdAt: string;
  updatedAt: string;
  status: string;
};

const emptySeen = (): SeenMap => ({
  new: new Date(0).toISOString(),
  ongoing: new Date(0).toISOString(),
  closed: new Date(0).toISOString(),
  all: new Date(0).toISOString()
});

function readSeen(): SeenMap {
  if (typeof window === "undefined") return emptySeen();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySeen();
    return { ...emptySeen(), ...(JSON.parse(raw) as Partial<SeenMap>) };
  } catch {
    return emptySeen();
  }
}

function writeSeen(map: SeenMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function inquiryActivityIso(inquiry: Pick<ProviderInquiryActivity, "createdAt" | "updatedAt">) {
  const created = new Date(inquiry.createdAt).getTime();
  const updated = new Date(inquiry.updatedAt).getTime();
  const ms = Math.max(
    Number.isFinite(created) ? created : 0,
    Number.isFinite(updated) ? updated : 0
  );
  return new Date(ms).toISOString();
}

function maxInquiryActivity(inquiries: Array<Pick<ProviderInquiryActivity, "createdAt" | "updatedAt">>) {
  if (!inquiries.length) return null;
  return inquiries.reduce((latest, item) => {
    const activity = inquiryActivityIso(item);
    return activity > latest ? activity : latest;
  }, inquiryActivityIso(inquiries[0]));
}

function advanceSeen(current: string, next: string | null) {
  if (!next) return current;
  return next > current ? next : current;
}

export function getProviderInquiryTabSeenAt(): SeenMap {
  return readSeen();
}

/**
 * Acknowledge the current tab contents so leaving the tab does not re-badge
 * inquiries the provider already had on screen. Never moves a watermark backwards.
 * Visiting "all" also acknowledges every status tab.
 */
export function markProviderInquiryTabSeen(tab: ProviderInquiryTab, inquiries: ProviderInquiryActivity[]) {
  const map = readSeen();
  const tabInquiries = filterProviderInquiriesByTab(inquiries, tab);
  map[tab] = advanceSeen(map[tab], maxInquiryActivity(tabInquiries));

  if (tab === "all") {
    map.new = advanceSeen(map.new, maxInquiryActivity(filterProviderInquiriesByTab(inquiries, "new")));
    map.ongoing = advanceSeen(
      map.ongoing,
      maxInquiryActivity(filterProviderInquiriesByTab(inquiries, "ongoing"))
    );
    map.closed = advanceSeen(map.closed, maxInquiryActivity(filterProviderInquiriesByTab(inquiries, "closed")));
  }

  writeSeen(map);
  return map;
}

export function countUnseenProviderInquiriesInTab(
  inquiries: ProviderInquiryActivity[],
  tab: ProviderInquiryTab,
  seenAt: string
) {
  const seen = new Date(seenAt).getTime();
  if (!Number.isFinite(seen)) {
    return filterProviderInquiriesByTab(inquiries, tab).length;
  }
  return filterProviderInquiriesByTab(inquiries, tab).filter(
    (item) => new Date(inquiryActivityIso(item)).getTime() > seen
  ).length;
}

/** First visit: treat current inquiries as already seen so only future updates badge. */
export function initProviderInquiryTabSeenFromData(inquiries: ProviderInquiryActivity[]) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(STORAGE_KEY)) return;

  writeSeen({
    new: maxInquiryActivity(filterProviderInquiriesByTab(inquiries, "new")) ?? new Date(0).toISOString(),
    ongoing:
      maxInquiryActivity(filterProviderInquiriesByTab(inquiries, "ongoing")) ?? new Date(0).toISOString(),
    closed:
      maxInquiryActivity(filterProviderInquiriesByTab(inquiries, "closed")) ?? new Date(0).toISOString(),
    all: maxInquiryActivity(inquiries) ?? new Date(0).toISOString()
  });
}
