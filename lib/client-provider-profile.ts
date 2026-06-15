export type StoredProviderProfile = {
  facilityName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  facilityType: string;
  bedsTotal: string;
  bedsOpen: string;
  services: string[];
  languages: string[];
  description: string;
  availability: string;
};

const STORAGE_KEY = "shepherds:provider-profile";

export const defaultProviderProfile: StoredProviderProfile = {
  facilityName: "",
  contactName: "",
  email: "",
  phone: "",
  city: "",
  province: "Utrecht",
  facilityType: "Assisted living",
  bedsTotal: "",
  bedsOpen: "",
  services: [],
  languages: [],
  description: "",
  availability: "Not set"
};

export function saveProviderProfile(profile: StoredProviderProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function getProviderProfile(): StoredProviderProfile {
  if (typeof window === "undefined") return defaultProviderProfile;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultProviderProfile;
  try {
    return { ...defaultProviderProfile, ...(JSON.parse(raw) as StoredProviderProfile) };
  } catch {
    return defaultProviderProfile;
  }
}
