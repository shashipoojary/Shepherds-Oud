import { PartnerClient, type PartnerReferral } from "@/components/crisis-v2/partner-client";
import { getServerSession, getUserRole } from "@/lib/auth/server";
import { prisma } from "@/lib/core/db";
import { getUserLinkedProvider } from "@/lib/providers/server";
import type { PlacementFeeStatus, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

async function getPartnerReferrals(userId: string, role: "PROVIDER" | "ADMIN"): Promise<PartnerReferral[]> {
  const openStatuses: PlacementFeeStatus[] = ["PENDING", "INVOICED"];
  let where: Prisma.PlacementReferralWhereInput = { feeStatus: { in: openStatuses } };

  if (role === "PROVIDER") {
    const provider = await getUserLinkedProvider(userId);
    where = {
      feeStatus: { in: openStatuses },
      directoryProvider: { linkedProviderId: provider?.id || "__none__" }
    };
  }

  const referrals = await prisma.placementReferral.findMany({
    where,
    include: {
      directoryProvider: { select: { name: true } },
      careCase: { select: { id: true, chosenPath: true } }
    },
    orderBy: { referredAt: "desc" },
    take: 50
  });

  return referrals.map((item) => ({
    id: item.id,
    feeStatus: item.feeStatus,
    referredAt: item.referredAt.toISOString(),
    providerName: item.directoryProvider.name,
    caseId: item.careCase.id,
    path: item.careCase.chosenPath
  }));
}

export default async function CrisisV2PartnerPage() {
  const session = await getServerSession();
  const role = session ? getUserRole(session) : null;
  const initialReferrals =
    session && (role === "PROVIDER" || role === "ADMIN")
      ? await getPartnerReferrals(session.user.id, role)
      : undefined;

  return <PartnerClient initialReferrals={initialReferrals} />;
}
