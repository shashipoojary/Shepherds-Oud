import { redirect } from "next/navigation";

/** Old Care Guide intake — retired; crisis triage is the primary family flow. */
export default function LegacyFamilyIntakeRedirect() {
  redirect("/triage/1");
}
