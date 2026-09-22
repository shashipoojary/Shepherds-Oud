import { DB_IDLE_MS, LAST_BACKEND_OK_KEY } from "@/lib/client/db-cold-start/config";

export function getLastBackendOkAt(): number | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LAST_BACKEND_OK_KEY);
    if (!raw) return null;

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setLastBackendOkAt(timestamp = Date.now()) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LAST_BACKEND_OK_KEY, String(timestamp));
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function isBackendIdleBeyondThreshold(now = Date.now()) {
  const lastOk = getLastBackendOkAt();
  if (lastOk === null) return true;
  return now - lastOk >= DB_IDLE_MS;
}
