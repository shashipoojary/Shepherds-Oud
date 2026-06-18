import { prisma } from "@/lib/db";
import { compareMatchPriority } from "@/lib/match-status";
import { normalizeIntakeStatus } from "@/lib/intake-workflow";

export async function getAdminDashboardData() {
  const [totalFamilies, activeCases, placements, providerCount, intakes, providers, matches, waitlist, careGuides] =
    await Promise.all([
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
        email: true,
        phone: true,
        relationship: true,
        ageRange: true,
        careTypes: true,
        preferredArea: true,
        urgency: true,
        budget: true,
        languages: true,
        additionalNeeds: true,
        notes: true,
        status: true,
        careGuideId: true,
        carePathway: true,
        assessmentNotes: true,
        carePlanSummary: true,
        visitScheduledAt: true,
        careGuide: { select: { id: true, name: true, email: true } },
        createdAt: true,
        updatedAt: true
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
        city: true,
        province: true,
        description: true,
        contactName: true,
        email: true,
        phone: true,
        website: true,
        bedsOpen: true,
        bedsTotal: true,
        availabilityStatus: true,
        waitlistText: true,
        services: true,
        languages: true,
        priceMin: true,
        priceMax: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    prisma.match.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        intakeId: true,
        providerId: true,
        score: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        intake: {
          select: {
            contactName: true,
            phone: true,
            email: true,
            preferredArea: true,
            urgency: true,
            careTypes: true
          }
        },
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
        message: true,
        relationship: true,
        ageRange: true,
        careTypes: true,
        facilityType: true,
        bedsTotal: true,
        services: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    prisma.user.findMany({
      where: { role: "ADMIN" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true }
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
      email: intake.email,
      phone: intake.phone,
      relationship: intake.relationship,
      context: `For loved one, ${intake.ageRange}`,
      care: intake.careTypes.join(", ") || "Not specified",
      location: intake.preferredArea,
      urgency: intake.urgency,
      budget: intake.budget,
      languages: intake.languages,
      additionalNeeds: intake.additionalNeeds,
      notes: intake.notes,
      ageRange: intake.ageRange,
      status: normalizeIntakeStatus(intake.status),
      careGuideId: intake.careGuideId,
      careGuideName: intake.careGuide?.name || intake.careGuide?.email || null,
      careGuideEmail: intake.careGuide?.email || null,
      carePathway: intake.carePathway,
      assessmentNotes: intake.assessmentNotes,
      carePlanSummary: intake.carePlanSummary,
      visitScheduledAt: intake.visitScheduledAt?.toLocaleDateString("en-GB") || null,
      createdAt: intake.createdAt.toLocaleDateString("en-GB"),
      createdAtIso: intake.createdAt.toISOString(),
      updatedAt: intake.updatedAt.toLocaleDateString("en-GB"),
      updatedAtIso: intake.updatedAt.toISOString()
    })),
    providerList: providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      type: provider.type,
      area: provider.area,
      city: provider.city,
      province: provider.province,
      description: provider.description,
      contactName: provider.contactName,
      email: provider.email,
      phone: provider.phone,
      website: provider.website,
      bedsOpen: provider.bedsOpen,
      bedsTotal: provider.bedsTotal,
      availabilityStatus: provider.availabilityStatus,
      waitlistText: provider.waitlistText,
      services: provider.services,
      languages: provider.languages,
      priceMin: provider.priceMin,
      priceMax: provider.priceMax,
      createdAt: provider.createdAt.toLocaleDateString("en-GB"),
      createdAtIso: provider.createdAt.toISOString(),
      updatedAt: provider.updatedAt.toLocaleDateString("en-GB"),
      updatedAtIso: provider.updatedAt.toISOString()
    })),
    inquiries: matches
      .map((match) => ({
        id: match.id,
        intakeId: match.intakeId,
        providerId: match.providerId,
        family: match.intake.contactName,
        familyPhone: match.intake.phone,
        familyEmail: match.intake.email,
        familyArea: match.intake.preferredArea,
        familyUrgency: match.intake.urgency,
        familyCare: match.intake.careTypes.join(", "),
        provider: match.provider.name,
        match: `${match.score}%`,
        date: match.createdAt.toLocaleDateString("en-GB"),
        createdAtIso: match.createdAt.toISOString(),
        updatedAt: match.updatedAt.toLocaleDateString("en-GB"),
        updatedAtIso: match.updatedAt.toISOString(),
        statusRaw: match.status,
        status: match.status.replaceAll("_", " "),
        notes: match.notes
      }))
      .sort((a, b) => {
        const priority = compareMatchPriority(a.statusRaw, b.statusRaw);
        return priority !== 0 ? priority : b.date.localeCompare(a.date);
      }),
    waitlist: waitlist.map((entry) => ({
      id: entry.id,
      type: entry.type,
      contactName: entry.contactName,
      name: entry.type === "FACILITY" ? entry.facilityName || entry.contactName : entry.contactName,
      email: entry.email,
      phone: entry.phone || null,
      city: entry.city,
      province: entry.province,
      message: entry.message,
      relationship: entry.relationship,
      ageRange: entry.ageRange,
      careTypes: entry.careTypes,
      facilityName: entry.facilityName,
      facilityType: entry.facilityType,
      bedsTotal: entry.bedsTotal,
      services: entry.services,
      location: [entry.city, entry.province].filter(Boolean).join(", ") || "—",
      status: entry.status,
      createdAt: entry.createdAt.toLocaleDateString("en-GB"),
      createdAtIso: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toLocaleDateString("en-GB"),
      updatedAtIso: entry.updatedAt.toISOString()
    })),
    careGuides
  };
}

export type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboardData>>;
