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
  return new Date(Math.max(created, updated)).toISOString();
}

function maxInquiryActivity(inquiries: Array<Pick<ProviderInquiryActivity, "createdAt" | "updatedAt">>) {
  if (!inquiries.length) return new Date().toISOString();
  return inquiries.reduce((latest, item) => {
    const activity = inquiryActivityIso(item);
    return activity > latest ? activity : latest;
  }, inquiryActivityIso(inquiries[0]));
}

export function getProviderInquiryTabSeenAt(): SeenMap {
  return readSeen();
}

export function markProviderInquiryTabSeen(tab: ProviderInquiryTab, inquiries: ProviderInquiryActivity[]) {
  const map = readSeen();
  const tabInquiries = filterProviderInquiriesByTab(inquiries, tab);
  map[tab] = maxInquiryActivity(tabInquiries);
  writeSeen(map);
  return map;
}

export function countUnseenProviderInquiriesInTab(
  inquiries: ProviderInquiryActivity[],
  tab: ProviderInquiryTab,
  seenAt: string
) {
  const seen = new Date(seenAt).getTime();
  return filterProviderInquiriesByTab(inquiries, tab).filter(
    (item) => new Date(inquiryActivityIso(item)).getTime() > seen
  ).length;
}

/** First visit: treat current inquiries as already seen so only future updates badge. */
export function initProviderInquiryTabSeenFromData(inquiries: ProviderInquiryActivity[]) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(STORAGE_KEY)) return;

  writeSeen({
    new: maxInquiryActivity(filterProviderInquiriesByTab(inquiries, "new")),
    ongoing: maxInquiryActivity(filterProviderInquiriesByTab(inquiries, "ongoing")),
    closed: maxInquiryActivity(filterProviderInquiriesByTab(inquiries, "closed")),
    all: maxInquiryActivity(inquiries)
  });
}
