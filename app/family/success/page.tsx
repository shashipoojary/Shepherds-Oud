import { redirect } from "next/navigation";

/** Old Care Guide success — retired. */
export default function LegacyFamilySuccessRedirect() {
  redirect("/result");
}
