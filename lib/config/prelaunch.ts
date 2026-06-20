/**
 * Prelaunch mode (default): waitlist-only public site — family intake paths redirect away.
 * Production mode: set NEXT_PUBLIC_PRELAUNCH=false for full guided intake flow.
 */
export const isPrelaunch = process.env.NEXT_PUBLIC_PRELAUNCH !== "false";

export const familyFlowPaths = ["/family/intake", "/family/success", "/family/dashboard", "/family/results"] as const;

export function isFamilyFlowPath(pathname: string) {
  return familyFlowPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function prelaunchFamilyRedirect(pathname: string) {
  return pathname.startsWith("/family/intake") ? "/register/family" : "/register";
}

export const publicRoutes = {
  home: "/",
  waitlist: "/register",
  waitlistFamily: "/register/family",
  waitlistFacility: "/register/facility",
  intake: "/family/intake",
  familyPrimary: isPrelaunch ? "/register/family" : "/family/intake",
  familyPrimaryLabel: isPrelaunch ? "Join the waitlist" : "Start guided intake",
  familySecondary: isPrelaunch ? null : "/register",
  familySecondaryLabel: "Join the waitlist"
} as const;

export function familyWaitlistSuccessPath() {
  return "/register/success?type=family";
}

export function familyPostWaitlistPath() {
  return isPrelaunch ? familyWaitlistSuccessPath() : `${publicRoutes.intake}?from=waitlist`;
}
