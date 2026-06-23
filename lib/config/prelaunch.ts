/**
 * Prelaunch mode (default): waitlist-only public site — family intake paths redirect away.
 * Production mode: set PRELAUNCH=false or NEXT_PUBLIC_PRELAUNCH=false for full guided intake.
 *
 * PRELAUNCH (server) is read at request time on Vercel. NEXT_PUBLIC_PRELAUNCH is inlined at build
 * for client bundles; the root layout passes the resolved value through PrelaunchProvider.
 */
function parsePrelaunchValue(raw: string | undefined): boolean | undefined {
  if (raw === undefined) return undefined;
  const value = raw.trim().toLowerCase();
  if (!value) return undefined;
  if (value === "false" || value === "0" || value === "no" || value === "off") return false;
  if (value === "true" || value === "1" || value === "yes" || value === "on") return true;
  return undefined;
}

export function getIsPrelaunch(): boolean {
  const fromServer = parsePrelaunchValue(process.env.PRELAUNCH);
  if (fromServer !== undefined) return fromServer;

  const fromPublic = parsePrelaunchValue(process.env.NEXT_PUBLIC_PRELAUNCH);
  if (fromPublic !== undefined) return fromPublic;

  return true;
}

export const familyFlowPaths = ["/family/intake", "/family/success", "/family/dashboard", "/family/results"] as const;

export function isFamilyFlowPath(pathname: string) {
  return familyFlowPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function prelaunchFamilyRedirect(pathname: string) {
  return pathname.startsWith("/family/intake") ? "/register/family" : "/register";
}

const routePaths = {
  home: "/",
  waitlist: "/register",
  waitlistFamily: "/register/family",
  waitlistFacility: "/register/facility",
  intake: "/family/intake"
} as const;

export type PublicRoutes = {
  home: string;
  waitlist: string;
  waitlistFamily: string;
  waitlistFacility: string;
  intake: string;
  familyPrimary: string;
  familyPrimaryLabel: string;
  familySecondary: string | null;
  familySecondaryLabel: string;
};

export function getPublicRoutes(prelaunch = getIsPrelaunch()): PublicRoutes {
  return {
    ...routePaths,
    familyPrimary: prelaunch ? routePaths.waitlistFamily : routePaths.intake,
    familyPrimaryLabel: prelaunch ? "Join the waitlist" : "Start guided intake",
    familySecondary: prelaunch ? null : routePaths.waitlist,
    familySecondaryLabel: "Join the waitlist"
  };
}

export function familyWaitlistSuccessPath() {
  return "/register/success?type=family";
}

export function familyPostWaitlistPath(prelaunch = getIsPrelaunch()) {
  const routes = getPublicRoutes(prelaunch);
  return prelaunch ? familyWaitlistSuccessPath() : `${routes.intake}?from=waitlist`;
}
