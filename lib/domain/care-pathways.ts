import { CARE_TYPE_OPTIONS } from "@/lib/domain/intake-field-utils";

/** Legacy pathway label kept so existing cases remain valid. */
const LEGACY_CARE_PATHWAYS = ["Dementia care"] as const;

const CARE_PATHWAY_VALUES = [...CARE_TYPE_OPTIONS, ...LEGACY_CARE_PATHWAYS] as const;

/** Admin-recommended pathway — mirrors intake care-type options (+ legacy). */
export const CARE_PATHWAYS = CARE_PATHWAY_VALUES as unknown as [
  (typeof CARE_PATHWAY_VALUES)[number],
  ...(typeof CARE_PATHWAY_VALUES)[number][]
];

export type CarePathway = (typeof CARE_PATHWAY_VALUES)[number];
