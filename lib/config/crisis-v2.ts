/** Crisis triage is the primary family product path (no feature flag). */
export function isCrisisV2Enabled() {
  return true;
}

/** Public app base for crisis triage pages (root — not a /v2 side path). */
export const CRISIS_V2_BASE = "";

export const crisisPaths = {
  home: "/",
  triage: (step: number | string) => `/triage/${step}`,
  result: "/result",
  signup: "/signup",
  patient: "/patient",
  dashboard: "/dashboard",
  tasks: (id: string) => `/tasks/${id}`,
  directory: "/directory",
  directoryDetail: (id: string) => `/directory/${id}`,
  partner: "/partner",
  settings: "/settings"
} as const;
