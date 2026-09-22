import { redirect } from "next/navigation";
import { SignupClient } from "@/components/crisis-v2/signup-client";
import { getServerSession } from "@/lib/auth/server";
import { claimAnonymousTriageCase, getFamilyCaseId } from "@/lib/data/family-crisis";

export const dynamic = "force-dynamic";

export default async function CrisisSignupPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  if (!params.callbackUrl?.startsWith("/signup")) {
    redirect("/signup?callbackUrl=/signup");
  }

  const session = await getServerSession();
  if (session?.user?.id) {
    const claimed = await claimAnonymousTriageCase(session.user.id, session.user);
    if (claimed.ok) redirect("/patient");

    const existingCaseId = await getFamilyCaseId(session.user.id);
    if (existingCaseId) redirect("/patient");

    return (
      <SignupClient
        initialPhase="error"
        initialSignedIn
        initialMessage={claimed.error || "Could not save your triage to this account."}
      />
    );
  }

  return <SignupClient initialPhase="guest" />;
}
