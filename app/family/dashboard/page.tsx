import { redirect } from "next/navigation";

/** Old Care Guide dashboard — retired in favor of crisis triage dashboard. */
export default function LegacyFamilyDashboardRedirect() {
  redirect("/dashboard");
}
