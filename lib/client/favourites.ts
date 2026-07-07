const STORAGE_KEY = "shepherds:saved-providers";

export type SavedProviderEntry = {
  id: string;
  name: string;
};

function normalizeEntry(value: unknown): SavedProviderEntry | null {
  if (typeof value === "string" && value.trim()) {
    return { id: value.trim(), name: "Saved provider" };
  }
  if (value && typeof value === "object" && "id" in value) {
    const record = value as { id?: unknown; name?: unknown };
    const id = typeof record.id === "string" ? record.id.trim() : "";
    if (!id) return null;
    const name = typeof record.name === "string" && record.name.trim() ? record.name.trim() : "Saved provider";
    return { id, name };
  }
  return null;
}

export function getSavedProviders(): SavedProviderEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeEntry).filter((entry): entry is SavedProviderEntry => Boolean(entry));
  } catch {
    return [];
  }
}

export function getSavedProviderIds(): string[] {
  return getSavedProviders().map((entry) => entry.id);
}

export function isProviderSaved(providerId: string) {
  return getSavedProviderIds().includes(providerId);
}

export function clearSavedProviders() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function toggleSavedProvider(providerId: string, providerName?: string) {
  if (typeof window === "undefined") return false;
  const current = getSavedProviders();
  const exists = current.some((entry) => entry.id === providerId);
  const next = exists
    ? current.filter((entry) => entry.id !== providerId)
    : [...current, { id: providerId, name: providerName?.trim() || "Saved provider" }];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("shepherds:saved-providers-changed"));
  return !exists;
}
