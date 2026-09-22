import { DirectoryDetailClient } from "@/components/crisis-v2/directory-detail-client";
import { getServerSession } from "@/lib/auth/server";
import { getDirectoryProviderById } from "@/lib/data/directory";
import { getFamilyCaseId } from "@/lib/data/family-crisis";

export const dynamic = "force-dynamic";

export default async function CrisisV2DirectoryDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession();
  const [provider, caseId] = await Promise.all([
    getDirectoryProviderById(id),
    session?.user?.id ? getFamilyCaseId(session.user.id) : Promise.resolve(null)
  ]);

  return (
    <DirectoryDetailClient
      providerId={id}
      initialProvider={provider}
      initialCaseId={caseId}
    />
  );
}
