import type { PlacementFeeStatus } from "@prisma/client";

/** One-way fee transitions for a single referral only. Terminal: PAID, DECLINED. */
const ALLOWED: Record<PlacementFeeStatus, PlacementFeeStatus[]> = {
  PENDING: ["INVOICED", "PAID", "DECLINED"],
  INVOICED: ["PAID", "DECLINED"],
  PAID: [],
  DECLINED: []
};

export function allowedFeeTransitions(from: PlacementFeeStatus): PlacementFeeStatus[] {
  return ALLOWED[from] ?? [];
}

export function canTransitionFeeStatus(from: PlacementFeeStatus, to: PlacementFeeStatus): boolean {
  if (from === to) return false;
  return allowedFeeTransitions(from).includes(to);
}
