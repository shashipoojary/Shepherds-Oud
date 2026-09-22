export type AdminTab = "cases" | "referrals" | "providers" | "waitlist";

const STORAGE_KEY = "shepherds:admin-tab-seen";

type SeenMap = Record<AdminTab, string>;
type AdminSeenSnapshot = {
  crisisCases?: Array<{ createdAt: string; updatedAt?: string }>;
  crisisReferrals?: Array<{ referredAt: string; confirmedAt?: string | null }>;
  providerList: Array<{ createdAtIso: string; updatedAtIso?: string }>;
  waitlist: Array<{ createdAtIso: string; updatedAtIso?: string }>;
};

const emptySeen = (): SeenMap => ({
  cases: new Date(0).toISOString(),
  referrals: new Date(0).toISOString(),
  providers: new Date(0).toISOString(),
  waitlist: new Date(0).toISOString()
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

function maxIso(values: string[]) {
  if (!values.length) return null;
  return values.reduce((latest, value) => (value > latest ? value : latest), values[0]);
}

function maxActivityIso(items: Array<{ createdAtIso: string; updatedAtIso?: string }>) {
  return maxIso(items.flatMap((item) => [item.createdAtIso, item.updatedAtIso].filter(Boolean) as string[]));
}

function tabActivityIso(tab: AdminTab, snapshot: AdminSeenSnapshot) {
  switch (tab) {
    case "cases":
      return maxIso((snapshot.crisisCases || []).flatMap((item) => [item.createdAt, item.updatedAt].filter(Boolean) as string[]));
    case "referrals":
      return maxIso(
        (snapshot.crisisReferrals || []).flatMap((item) => [item.referredAt, item.confirmedAt].filter(Boolean) as string[])
      );
    case "providers":
      return maxActivityIso(snapshot.providerList);
    case "waitlist":
      return maxActivityIso(snapshot.waitlist);
    default:
      return null;
  }
}

function advanceSeen(current: string, next: string | null) {
  if (!next) return current;
  return next > current ? next : current;
}

export function getTabSeenAt(): SeenMap {
  return readSeen();
}

/**
 * Acknowledge the active tab's current rows so leaving the tab does not re-badge
 * items the admin already had on screen. Never moves a watermark backwards.
 * Does not mark individual rows as read — row pulse clears only when a row is opened.
 */
export function markTabSeen(tab: AdminTab, snapshot?: AdminSeenSnapshot) {
  const map = readSeen();
  map[tab] = advanceSeen(map[tab], snapshot ? tabActivityIso(tab, snapshot) : null);
  writeSeen(map);
  return map;
}

/** First visit: treat current data as already seen so only future items badge. */
export function initTabSeenFromData(snapshot: AdminSeenSnapshot) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(STORAGE_KEY)) return;

  writeSeen({
    cases: tabActivityIso("cases", snapshot) ?? new Date(0).toISOString(),
    referrals: tabActivityIso("referrals", snapshot) ?? new Date(0).toISOString(),
    providers: tabActivityIso("providers", snapshot) ?? new Date(0).toISOString(),
    waitlist: tabActivityIso("waitlist", snapshot) ?? new Date(0).toISOString()
  });
}

function itemActivityTime(item: { createdAtIso: string; updatedAtIso?: string }) {
  const created = new Date(item.createdAtIso).getTime();
  const updated = item.updatedAtIso ? new Date(item.updatedAtIso).getTime() : created;
  return Math.max(
    Number.isFinite(created) ? created : 0,
    Number.isFinite(updated) ? updated : 0
  );
}

export function countUnseenProviders(items: Array<{ createdAtIso: string; updatedAtIso?: string }>, seenAt: string) {
  const seen = new Date(seenAt).getTime();
  if (!Number.isFinite(seen)) return items.length;
  return items.filter((item) => itemActivityTime(item) > seen).length;
}

export function countUnseenWaitlist(
  items: Array<{ createdAtIso: string; updatedAtIso?: string; status: string }>,
  seenAt: string
) {
  const seen = new Date(seenAt).getTime();
  if (!Number.isFinite(seen)) {
    return items.filter((item) => item.status !== "CONTACTED" && item.status !== "CONVERTED" && item.status !== "CLOSED")
      .length;
  }
  return items.filter((item) => {
    if (item.status === "CONTACTED" || item.status === "CONVERTED" || item.status === "CLOSED") return false;
    return itemActivityTime(item) > seen;
  }).length;
}

function countUnseenByActivity(items: Array<{ createdAtIso: string; updatedAtIso?: string }>, seenAt: string) {
  const seen = new Date(seenAt).getTime();
  if (!Number.isFinite(seen)) return items.length;
  return items.filter((item) => itemActivityTime(item) > seen).length;
}

export function countUnseenCrisisCases(items: Array<{ createdAt: string; updatedAt?: string }>, seenAt: string) {
  return countUnseenByActivity(
    items.map((item) => ({ createdAtIso: item.createdAt, updatedAtIso: item.updatedAt })),
    seenAt
  );
}

export function countUnseenCrisisReferrals(
  items: Array<{ referredAt: string; confirmedAt?: string | null }>,
  seenAt: string
) {
  return countUnseenByActivity(
    items.map((item) => ({
      createdAtIso: item.referredAt,
      updatedAtIso: item.confirmedAt || item.referredAt
    })),
    seenAt
  );
}
