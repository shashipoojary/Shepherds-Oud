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
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function getProviderInquirySeenAt(inquiryId: string) {
  return readMap()[inquiryId] ?? null;
}

export function markProviderInquirySeen(inquiryId: string, updatedAtIso: string) {
  const map = readMap();
  map[inquiryId] = updatedAtIso;
  writeMap(map);
}

export function isProviderInquiryUnread(inquiryId: string, updatedAtIso: string) {
  const seenAt = getProviderInquirySeenAt(inquiryId);
  if (!seenAt) return true;
  return new Date(updatedAtIso).getTime() > new Date(seenAt).getTime();
}

export function countUnreadProviderInquiries(items: Array<{ id: string; updatedAt: string }>) {
  return items.filter((item) => isProviderInquiryUnread(item.id, item.updatedAt)).length;
}
