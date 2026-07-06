export type AdminTab = "families" | "providers" | "inquiries" | "waitlist";

const STORAGE_KEY = "shepherds:admin-tab-seen";

type SeenMap = Record<AdminTab, string>;
type AdminSeenSnapshot = {
  families: Array<{ createdAtIso: string; updatedAtIso?: string }>;
  providerList: Array<{ createdAtIso: string; updatedAtIso?: string }>;
  inquiries: Array<{ createdAtIso: string; updatedAtIso: string }>;
  waitlist: Array<{ createdAtIso: string; updatedAtIso?: string }>;
};

const emptySeen = (): SeenMap => ({
  families: new Date(0).toISOString(),
  providers: new Date(0).toISOString(),
  inquiries: new Date(0).toISOString(),
  waitlist: new Date(0).toISOString()
});

function readSeen(): SeenMap {
  if (typeof window === "undefined") return emptySeen();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptySeen();
  try {
    return { ...emptySeen(), ...(JSON.parse(raw) as Partial<SeenMap>) };
  } catch {
    return emptySeen();
  }
}

function writeSeen(map: SeenMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function maxIso(values: string[]) {
  if (!values.length) return new Date().toISOString();
  return values.reduce((latest, value) => (value > latest ? value : latest), values[0]);
}

function maxActivityIso(items: Array<{ createdAtIso: string; updatedAtIso?: string }>) {
  return maxIso(items.flatMap((item) => [item.createdAtIso, item.updatedAtIso].filter(Boolean) as string[]));
}

function tabActivityIso(tab: AdminTab, snapshot: AdminSeenSnapshot) {
  switch (tab) {
    case "families":
      return maxActivityIso(snapshot.families);
    case "providers":
      return maxActivityIso(snapshot.providerList);
    case "inquiries":
      return maxActivityIso(snapshot.inquiries);
    case "waitlist":
      return maxActivityIso(snapshot.waitlist);
    default:
      return new Date().toISOString();
  }
}

export function getTabSeenAt(): SeenMap {
  return readSeen();
}

export function markTabSeen(tab: AdminTab, snapshot?: AdminSeenSnapshot) {
  const map = readSeen();
  map[tab] = snapshot ? tabActivityIso(tab, snapshot) : new Date().toISOString();
  writeSeen(map);
  return map;
}

/** First visit: treat current data as already seen so only future items badge. */
export function initTabSeenFromData(snapshot: AdminSeenSnapshot) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(STORAGE_KEY)) return;

  writeSeen({
    families: tabActivityIso("families", snapshot),
    providers: tabActivityIso("providers", snapshot),
    inquiries: tabActivityIso("inquiries", snapshot),
    waitlist: tabActivityIso("waitlist", snapshot)
  });
}

function itemActivityTime(item: { createdAtIso: string; updatedAtIso?: string }) {
  const created = new Date(item.createdAtIso).getTime();
  const updated = item.updatedAtIso ? new Date(item.updatedAtIso).getTime() : created;
  return Math.max(created, updated);
}

export function countUnseenFamilies(items: Array<{ createdAtIso: string; updatedAtIso?: string }>, seenAt: string) {
  const seen = new Date(seenAt).getTime();
  return items.filter((item) => itemActivityTime(item) > seen).length;
}

export function countUnseenProviders(items: Array<{ createdAtIso: string; updatedAtIso?: string }>, seenAt: string) {
  const seen = new Date(seenAt).getTime();
  return items.filter((item) => itemActivityTime(item) > seen).length;
}

export function countUnseenInquiries(items: Array<{ createdAtIso: string; updatedAtIso: string }>, seenAt: string) {
  const seen = new Date(seenAt).getTime();
  return items.filter((item) => {
    const activity = Math.max(new Date(item.createdAtIso).getTime(), new Date(item.updatedAtIso).getTime());
    return activity > seen;
  }).length;
}

export function countUnseenWaitlist(
  items: Array<{ createdAtIso: string; updatedAtIso?: string; status: string }>,
  seenAt: string
) {
  const seen = new Date(seenAt).getTime();
  return items.filter((item) => {
    if (item.status === "CONTACTED" || item.status === "CONVERTED" || item.status === "CLOSED") return false;
    return itemActivityTime(item) > seen;
  }).length;
}
