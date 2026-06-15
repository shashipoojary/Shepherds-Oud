import { prisma } from "@/lib/db";

export async function getAdminDashboardData() {
  const [totalFamilies, activeCases, placements, providerCount, intakes, providers, matches, waitlist] = await Promise.all([
    prisma.intake.count(),
    prisma.intake.count({ where: { status: { notIn: ["PLACED", "CLOSED"] } } }),
    prisma.intake.count({ where: { status: "PLACED" } }),
    prisma.provider.count(),
    prisma.intake.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        contactName: true,
        ageRange: true,
        careTypes: true,
        preferredArea: true,
        urgency: true,
        status: true
      }
    }),
    prisma.provider.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        type: true,
        area: true,
        bedsOpen: true,
        bedsTotal: true
      }
    }),
    prisma.match.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        score: true,
        status: true,
        createdAt: true,
        intake: { select: { contactName: true } },
        provider: { select: { name: true } }
      }
    }),
    prisma.waitlistEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        type: true,
        contactName: true,
        facilityName: true,
        email: true,
        phone: true,
        city: true,
        province: true,
        status: true,
        createdAt: true
      }
    })
  ]);

  return {
    stats: [
      [String(totalFamilies), "Total families"],
      [String(activeCases), "Active cases"],
      [String(placements), "Placements"],
      [String(providerCount), "Providers"]
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
    }))
  };
}

export type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboardData>>;
