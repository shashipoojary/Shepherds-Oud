export const CARE_PATHWAYS = [
  "Home care",
  "Assisted living",
  "Nursing care",
  "Dementia care",
  "Respite care"
] as const;

export type CarePathway = (typeof CARE_PATHWAYS)[number];
