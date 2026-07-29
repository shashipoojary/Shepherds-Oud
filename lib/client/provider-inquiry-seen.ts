const STORAGE_KEY = "shepherds-oud:provider-inquiry-seen";

type SeenMap = Record<string, string>;

function readMap(): SeenMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SeenMap) : {};
  } catch {
    return {};
  }
}

function writeMap(map: SeenMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore quota / private mode errors.
  }
}

function activityTimeMs(updatedAtIso: string, createdAtIso?: string) {
  const updated = new Date(updatedAtIso).getTime();
  const created = createdAtIso ? new Date(createdAtIso).getTime() : Number.NaN;
  if (Number.isFinite(created) && Number.isFinite(updated)) return Math.max(created, updated);
  if (Number.isFinite(updated)) return updated;
  if (Number.isFinite(created)) return created;
  return 0;
}

export function providerInquiryActivityIso(updatedAtIso: string, createdAtIso?: string) {
  return new Date(activityTimeMs(updatedAtIso, createdAtIso)).toISOString();
}

export function getProviderInquirySeenAt(inquiryId: string) {
  return readMap()[inquiryId] ?? null;
}

export function markProviderInquirySeen(
  inquiryId: string,
  updatedAtIso: string,
  createdAtIso?: string
) {
  const map = readMap();
  const activity = providerInquiryActivityIso(updatedAtIso, createdAtIso);
  const previous = map[inquiryId];
  if (!previous || activityTimeMs(activity) >= activityTimeMs(previous)) {
    map[inquiryId] = activity;
    writeMap(map);
  }
}

/** First visit: treat current inquiries as already seen so only future updates badge. */
export function initProviderInquirySeenFromData(
  items: Array<{ id: string; updatedAt: string; createdAt?: string }>
) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(STORAGE_KEY)) return;

  const map: SeenMap = {};
  for (const item of items) {
    map[item.id] = providerInquiryActivityIso(item.updatedAt, item.createdAt);
  }
  writeMap(map);
}

export function isProviderInquiryUnread(
  inquiryId: string,
  updatedAtIso: string,
  createdAtIso?: string
) {
  const seenAt = getProviderInquirySeenAt(inquiryId);
  if (!seenAt) return true;
  return activityTimeMs(updatedAtIso, createdAtIso) > activityTimeMs(seenAt);
}

export function countUnreadProviderInquiries(
  items: Array<{ id: string; updatedAt: string; createdAt?: string }>
) {
  return items.filter((item) => isProviderInquiryUnread(item.id, item.updatedAt, item.createdAt)).length;
}

export function markAllProviderInquiriesSeen(
  items: Array<{ id: string; updatedAt: string; createdAt?: string }>
) {
  if (!items.length) return;
  const map = readMap();
  for (const item of items) {
    const activity = providerInquiryActivityIso(item.updatedAt, item.createdAt);
    const previous = map[item.id];
    if (!previous || activityTimeMs(activity) >= activityTimeMs(previous)) {
      map[item.id] = activity;
    }
  }
  writeMap(map);
}
