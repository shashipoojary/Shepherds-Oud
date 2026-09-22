import { ResultClient } from "@/components/crisis-v2/result-client";
import { getAnonymousTriageResult } from "@/lib/data/family-crisis";

export const dynamic = "force-dynamic";

export default async function CrisisV2ResultPage() {
  const initialResult = await getAnonymousTriageResult();
  return <ResultClient initialResult={initialResult} />;
}
