import { redirect } from "next/navigation";

/** Old Care Guide results — retired. */
export default function LegacyFamilyResultsRedirect() {
  redirect("/result");
}
