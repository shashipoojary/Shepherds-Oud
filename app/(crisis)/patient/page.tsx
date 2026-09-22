import { PatientClient } from "@/components/crisis-v2/patient-client";
import { getServerSession } from "@/lib/auth/server";
import { getFamilyCaseId } from "@/lib/data/family-crisis";

export const dynamic = "force-dynamic";

export default async function CrisisV2PatientPage() {
  const session = await getServerSession();
  const initialCaseId = session?.user?.id ? await getFamilyCaseId(session.user.id) : null;

  return <PatientClient initialCaseId={initialCaseId} />;
}
