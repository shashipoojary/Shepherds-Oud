import { DirectoryClient } from "@/components/crisis-v2/directory-client";
import { getServerSession } from "@/lib/auth/server";
import { listDirectoryProviders } from "@/lib/data/directory";
import { getFamilyCaseId } from "@/lib/data/family-crisis";

export const dynamic = "force-dynamic";

export default async function CrisisV2DirectoryPage() {
  const session = await getServerSession();
  const [providers, caseId] = await Promise.all([
    listDirectoryProviders(),
    session?.user?.id ? getFamilyCaseId(session.user.id) : Promise.resolve(null)
  ]);

  return <DirectoryClient initialProviders={providers} initialCaseId={caseId} />;
}
