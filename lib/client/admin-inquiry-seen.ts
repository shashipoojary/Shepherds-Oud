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

export function markAdminInquirySeen(inquiryId: string, updatedAtIso: string) {
  const map = readMap();
  map[inquiryId] = updatedAtIso;
  writeMap(map);
}

/** First visit: treat current inquiries as already seen so only future updates badge. */
export function initAdminInquirySeenFromData(items: Array<{ id: string; updatedAtIso: string }>) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(STORAGE_KEY)) return;

  const map: SeenMap = {};
  for (const item of items) {
    map[item.id] = item.updatedAtIso;
  }
  writeMap(map);
}

export function isAdminInquiryUnread(inquiryId: string, updatedAtIso: string) {
  const seenAt = readMap()[inquiryId];
  if (!seenAt) return true;
  return new Date(updatedAtIso).getTime() > new Date(seenAt).getTime();
}

export function countUnreadAdminInquiries(items: Array<{ id: string; updatedAtIso: string }>) {
  return items.filter((item) => isAdminInquiryUnread(item.id, item.updatedAtIso)).length;
}

export function markAllAdminInquiriesSeen(items: Array<{ id: string; updatedAtIso: string }>) {
  if (!items.length) return;
  const map = readMap();
  for (const item of items) {
    map[item.id] = item.updatedAtIso;
  }
  writeMap(map);
}
