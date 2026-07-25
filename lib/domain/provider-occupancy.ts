/**
 * Live occupancy snapshot from Provider bed scalars.
 * Not a history or room-inventory model — only current capacity.
 */

export type OccupancyBeds = {
  bedsOpen?: number | null;
  bedsTotal?: number | null;
};

/** Occupied share 0–100 when both bed counts are usable; otherwise null. */
export function occupancyPercent(beds: OccupancyBeds): number | null {
  const open = beds.bedsOpen;
  const total = beds.bedsTotal;
  if (open == null || total == null || total <= 0 || open < 0 || open > total) {
    return null;
  }
  return Math.round(((total - open) / total) * 100);
}

export function occupiedBeds(beds: OccupancyBeds): number | null {
  const open = beds.bedsOpen;
  const total = beds.bedsTotal;
  if (open == null || total == null || total < 0 || open < 0 || open > total) {
    return null;
  }
  return total - open;
}
