export type AdminTab = "families" | "providers" | "inquiries" | "waitlist";

const STORAGE_KEY = "shepherds:admin-tab-seen";

type SeenMap = Record<AdminTab, string>;

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

export function getTabSeenAt(): SeenMap {
  return readSeen();
}

export function markTabSeen(tab: AdminTab) {
  const map = readSeen();
  map[tab] = new Date().toISOString();
  writeSeen(map);
  return map;
}

/** First visit: treat current data as already seen so only future items badge. */
export function initTabSeenFromData(snapshot: {
  families: Array<{ createdAtIso: string }>;
  providerList: Array<{ createdAtIso: string }>;
  inquiries: Array<{ updatedAtIso: string }>;
  waitlist: Array<{ createdAtIso: string }>;
}) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(STORAGE_KEY)) return;

  writeSeen({
    families: maxIso(snapshot.families.map((item) => item.createdAtIso)),
    providers: maxIso(snapshot.providerList.map((item) => item.createdAtIso)),
    inquiries: maxIso(snapshot.inquiries.map((item) => item.updatedAtIso)),
    waitlist: maxIso(snapshot.waitlist.map((item) => item.createdAtIso))
  });
}

export function countUnseenFamilies(items: Array<{ createdAtIso: string }>, seenAt: string) {
  const seen = new Date(seenAt).getTime();
  return items.filter((item) => new Date(item.createdAtIso).getTime() > seen).length;
}

export function countUnseenProviders(items: Array<{ createdAtIso: string }>, seenAt: string) {
  const seen = new Date(seenAt).getTime();
  return items.filter((item) => new Date(item.createdAtIso).getTime() > seen).length;
}

export function countUnseenInquiries(items: Array<{ createdAtIso: string; updatedAtIso: string }>, seenAt: string) {
  const seen = new Date(seenAt).getTime();
  return items.filter((item) => {
    const activity = Math.max(new Date(item.createdAtIso).getTime(), new Date(item.updatedAtIso).getTime());
    return activity > seen;
  }).length;
}

export function countUnseenWaitlist(items: Array<{ createdAtIso: string; status: string }>, seenAt: string) {
  const seen = new Date(seenAt).getTime();
  return items.filter((item) => item.status !== "CONTACTED" && new Date(item.createdAtIso).getTime() > seen).length;
}
