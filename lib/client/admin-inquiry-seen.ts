const STORAGE_KEY = "shepherds:admin-inquiry-seen";

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

function activityMs(updatedAtIso: string, createdAtIso?: string) {
  const updated = new Date(updatedAtIso).getTime();
  const created = createdAtIso ? new Date(createdAtIso).getTime() : Number.NaN;
  if (Number.isFinite(created) && Number.isFinite(updated)) return Math.max(created, updated);
  if (Number.isFinite(updated)) return updated;
  if (Number.isFinite(created)) return created;
  return 0;
}

export function markAdminInquirySeen(inquiryId: string, updatedAtIso: string, createdAtIso?: string) {
  const map = readMap();
  const activity = new Date(activityMs(updatedAtIso, createdAtIso)).toISOString();
  const previous = map[inquiryId];
  if (!previous || activityMs(activity) >= activityMs(previous)) {
    map[inquiryId] = activity;
    writeMap(map);
  }
}

/** First visit: treat current inquiries as already seen so only future updates badge. */
export function initAdminInquirySeenFromData(
  items: Array<{ id: string; updatedAtIso: string; createdAtIso?: string }>
) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(STORAGE_KEY)) return;

  const map: SeenMap = {};
  for (const item of items) {
    map[item.id] = new Date(activityMs(item.updatedAtIso, item.createdAtIso)).toISOString();
  }
  writeMap(map);
}

export function isAdminInquiryUnread(inquiryId: string, updatedAtIso: string, createdAtIso?: string) {
  const seenAt = readMap()[inquiryId];
  if (!seenAt) return true;
  return activityMs(updatedAtIso, createdAtIso) > activityMs(seenAt);
}

export function countUnreadAdminInquiries(
  items: Array<{ id: string; updatedAtIso: string; createdAtIso?: string }>
) {
  return items.filter((item) => isAdminInquiryUnread(item.id, item.updatedAtIso, item.createdAtIso)).length;
}
