import { prisma } from "@/lib/core/db";

export async function resetOperationalData() {
  return prisma.$transaction(async (tx) => {
    const matches = await tx.match.deleteMany();
    const actionLogs = await tx.actionLog.deleteMany();
    const intakes = await tx.intake.deleteMany();
    const waitlist = await tx.waitlistEntry.deleteMany();
    await tx.user.updateMany({ data: { linkedProviderId: null } });
    const providers = await tx.provider.deleteMany();

    return {
      matches: matches.count,
      actionLogs: actionLogs.count,
      intakes: intakes.count,
      waitlist: waitlist.count,
      providers: providers.count
    };
  });
}
