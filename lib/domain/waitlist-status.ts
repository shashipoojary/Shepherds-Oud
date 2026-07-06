export type WaitlistStatus = "NEW" | "CONTACTED" | "CONVERTED" | "CLOSED";

const WAITLIST_STATUS_ORDER: Record<WaitlistStatus, number> = {
  NEW: 0,
  CONTACTED: 1,
  CONVERTED: 2,
  CLOSED: 3
};

export function canTransitionWaitlistStatus(current: WaitlistStatus, next: WaitlistStatus) {
  if (current === next) return true;
  if (current === "CLOSED") return false;
  if (current === "CONVERTED") return next === "CLOSED";
  if (next === "CLOSED") return true;
  return WAITLIST_STATUS_ORDER[next] >= WAITLIST_STATUS_ORDER[current];
}

export function isResolvedWaitlistStatus(status: string) {
  return status === "CONTACTED" || status === "CONVERTED" || status === "CLOSED";
}

export function waitlistStatusLabel(status: string) {
  switch (status) {
    case "NEW":
      return "New";
    case "CONTACTED":
      return "Contacted";
    case "CONVERTED":
      return "Converted";
    case "CLOSED":
      return "Closed";
    default:
      return status;
  }
}
