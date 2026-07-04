import { prisma } from "@/lib/core/db";
import { displayVisitAvailability } from "@/lib/config/content";
import { compareMatchPriority } from "@/lib/domain/match-status";
import { normalizeIntakeStatus } from "@/lib/domain/intake-workflow";
import { ensureAcceptedProviderInvitesHaveProfiles } from "@/lib/providers/invite";
import { getProviderProfileMissingRequirements } from "@/lib/providers/completeness";

export async function getAdminDashboardData() {
  await ensureAcceptedProviderInvitesHaveProfiles();

  const [statusGroups, providerCount, intakes, providers, matches, waitlist, careGuides] = await Promise.all([
    prisma.intake.groupBy({
      by: ["status"],
      _count: { _all: true }
    }),
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
        livingSituation: true,
        moveInTimeline: true,
        mobility: true,
        dementiaNeeds: true,
        hospitalDischargeDate: true,
        decisionMakerName: true,
        decisionMakerRelationship: true,
        emotionalSupportNeeds: true,
        supportTypes: true,
        notes: true,
        status: true,
        careGuideId: true,
        carePathway: true,
        assessmentNotes: true,
        carePlanSummary: true,
        visitScheduledAt: true,
        visitType: true,
        visitProviderName: true,
        visitNotes: true,
        followUp7At: true,
        followUp30At: true,
        followUp90At: true,
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
        careLevels: true,
        dementiaCapacity: true,
        fundingTypes: true,
        responseTimeHours: true,
        visitAvailability: true,
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
        declineReason: true,
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

  const totalFamilies = statusGroups.reduce((sum, group) => sum + group._count._all, 0);
  const placements = statusGroups
    .filter((group) => group.status === "PLACED")
    .reduce((sum, group) => sum + group._count._all, 0);
  const activeCases = statusGroups
    .filter((group) => group.status !== "CLOSED")
    .reduce((sum, group) => sum + group._count._all, 0);
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
      careTypes: intake.careTypes,
      location: intake.preferredArea,
      urgency: intake.urgency,
      budget: intake.budget,
      languages: intake.languages,
      additionalNeeds: intake.additionalNeeds,
      livingSituation: intake.livingSituation,
      moveInTimeline: intake.moveInTimeline,
      mobility: intake.mobility,
      dementiaNeeds: intake.dementiaNeeds,
      hospitalDischargeDate: intake.hospitalDischargeDate?.toLocaleDateString("en-GB") || null,
      decisionMakerName: intake.decisionMakerName,
      decisionMakerRelationship: intake.decisionMakerRelationship,
      emotionalSupportNeeds: intake.emotionalSupportNeeds,
      supportTypes: intake.supportTypes,
      notes: intake.notes,
      ageRange: intake.ageRange,
      status: normalizeIntakeStatus(intake.status),
      careGuideId: intake.careGuideId,
      careGuideName: intake.careGuide?.name || intake.careGuide?.email || null,
      careGuideEmail: intake.careGuide?.email || null,
      carePathway: intake.carePathway,
      assessmentNotes: intake.assessmentNotes,
      carePlanSummary: intake.carePlanSummary,
      visitScheduledAt: intake.visitScheduledAt?.toISOString() || null,
      visitScheduledAtLabel: intake.visitScheduledAt?.toLocaleString("en-GB") || null,
      visitType: intake.visitType,
      visitProviderName: intake.visitProviderName,
      visitNotes: intake.visitNotes,
      followUp7At: intake.followUp7At?.toLocaleDateString("en-GB") || null,
      followUp30At: intake.followUp30At?.toLocaleDateString("en-GB") || null,
      followUp90At: intake.followUp90At?.toLocaleDateString("en-GB") || null,
      createdAt: intake.createdAt.toLocaleDateString("en-GB"),
      createdAtIso: intake.createdAt.toISOString(),
      updatedAt: intake.updatedAt.toLocaleDateString("en-GB"),
      updatedAtIso: intake.updatedAt.toISOString()
    })),
    providerList: providers.map((provider) => {
      const profileMissingRequirements = getProviderProfileMissingRequirements(provider);
      return {
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
      careLevels: provider.careLevels,
      dementiaCapacity: provider.dementiaCapacity,
      fundingTypes: provider.fundingTypes,
      responseTimeHours: provider.responseTimeHours,
      visitAvailability: displayVisitAvailability(provider.visitAvailability),
      priceMin: provider.priceMin,
      priceMax: provider.priceMax,
      profileComplete: profileMissingRequirements.length === 0,
      profileMissingRequirements,
      createdAt: provider.createdAt.toLocaleDateString("en-GB"),
      createdAtIso: provider.createdAt.toISOString(),
      updatedAt: provider.updatedAt.toLocaleDateString("en-GB"),
      updatedAtIso: provider.updatedAt.toISOString()
    };
    }),
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
        notes: match.notes,
        declineReason: match.declineReason
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
