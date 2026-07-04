export type AdminItemScope = "family" | "provider" | "inquiry" | "waitlist";

const STORAGE_KEY = "shepherds:admin-item-seen";

type SeenMap = Record<string, string>;

function itemKey(scope: AdminItemScope, id: string) {
  return `${scope}:${id}`;
}

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

export function activityIso(createdAtIso: string, updatedAtIso?: string) {
  const created = new Date(createdAtIso).getTime();
  const updated = updatedAtIso ? new Date(updatedAtIso).getTime() : created;
  return new Date(Math.max(created, updated)).toISOString();
}

export function markAdminItemSeen(scope: AdminItemScope, id: string, createdAtIso: string, updatedAtIso?: string) {
  const map = readMap();
  map[itemKey(scope, id)] = activityIso(createdAtIso, updatedAtIso);
  writeMap(map);
}

export function isAdminItemUnread(scope: AdminItemScope, id: string, createdAtIso: string, updatedAtIso?: string) {
  const seenAt = readMap()[itemKey(scope, id)];
  if (!seenAt) return true;
  return new Date(activityIso(createdAtIso, updatedAtIso)).getTime() > new Date(seenAt).getTime();
}

export type AdminItemSeed = {
  scope: AdminItemScope;
  id: string;
  createdAtIso: string;
  updatedAtIso?: string;
};

/** First visit: treat current rows as already seen so only future updates badge. */
export function initAdminItemsSeenFromData(items: AdminItemSeed[]) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(STORAGE_KEY)) return;

  const map: SeenMap = {};
  for (const item of items) {
    map[itemKey(item.scope, item.id)] = activityIso(item.createdAtIso, item.updatedAtIso);
  }
  writeMap(map);
}
