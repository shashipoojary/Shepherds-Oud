export const CARE_PATHWAYS = [
  "Assisted living",
  "Home care",
  "Nursing care",
  "Dementia / memory care",
  "Dementia care",
  "Rehabilitation",
  "Palliative care",
  "Respite care"
] as const;

export type CarePathway = (typeof CARE_PATHWAYS)[number];
