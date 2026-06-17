const STORAGE_KEY = "shepherds:saved-providers";

export function getSavedProviders(): string[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isProviderSaved(providerId: string) {
  return getSavedProviders().includes(providerId);
}

export function toggleSavedProvider(providerId: string) {
  if (typeof window === "undefined") return false;
  const current = getSavedProviders();
  const exists = current.includes(providerId);
  const next = exists ? current.filter((id) => id !== providerId) : [...current, providerId];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return !exists;
}
