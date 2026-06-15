import { prisma } from "@/lib/db";

export async function getAdminDashboardData() {
  const [intakes, providers, matches, waitlist, actionLogs] = await Promise.all([
    prisma.intake.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.provider.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.match.findMany({
      orderBy: { createdAt: "desc" },
      include: { intake: true, provider: true }
    }),
    prisma.waitlistEntry.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.actionLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 })
  ]);

  const activeCases = intakes.filter((intake) => !["PLACED", "CLOSED"].includes(intake.status)).length;
  const placements = intakes.filter((intake) => intake.status === "PLACED").length;

  return {
    stats: [
      [String(intakes.length), "Total families"],
      [String(activeCases), "Active cases"],
      [String(placements), "Placements"],
      [String(providers.length), "Providers"]
    ] as Array<[string, string]>,
    families: intakes.map((intake) => ({
      id: intake.id,
      name: intake.contactName,
      context: `For loved one, ${intake.ageRange}`,
      care: intake.careTypes.join(", ") || "Not specified",
      location: intake.preferredArea,
      urgency: intake.urgency,
      status: intake.status
    })),
    providerList: providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      type: provider.type,
      area: provider.area,
      bedsOpen: provider.bedsOpen,
      bedsTotal: provider.bedsTotal
    })),
    inquiries: matches.map((match) => ({
      id: match.id,
      family: match.intake.contactName,
      provider: match.provider.name,
      match: `${match.score}%`,
      date: match.createdAt.toLocaleDateString("en-GB"),
      status: match.status.replaceAll("_", " ")
    })),
    waitlist: waitlist.map((entry) => ({
      id: entry.id,
      type: entry.type,
      name: entry.type === "FACILITY" ? entry.facilityName || entry.contactName : entry.contactName,
      email: entry.email,
      phone: entry.phone || "—",
      location: [entry.city, entry.province].filter(Boolean).join(", ") || "—",
      status: entry.status,
      createdAt: entry.createdAt.toLocaleDateString("en-GB")
    })),
    actionLogs: actionLogs.map((log) => ({
      id: log.id,
      label: log.label,
      createdAt: log.createdAt.toLocaleString("en-GB")
    }))
  };
}

export type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboardData>>;
