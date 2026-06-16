import { prisma } from "@/lib/db";
import type { ProviderProfileInput } from "@/lib/validation/provider";

export async function getUserLinkedProvider(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { linkedProvider: true }
  });

  return user?.linkedProvider ?? null;
}

export async function upsertProviderForUser(userId: string, userEmail: string, input: ProviderProfileInput) {
  const area = [input.city, input.province].filter(Boolean).join(", ") || "Netherlands";
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error("User not found.");
  }

  const data = {
    name: input.name,
    type: input.type,
    area,
    city: input.city || null,
    province: input.province || null,
    description: input.description || "",
    contactName: input.contactName || user.name || null,
    email: input.email || userEmail,
    phone: input.phone || null,
    website: input.website || null,
    bedsTotal: input.bedsTotal ?? null,
    bedsOpen: input.bedsOpen ?? null,
    availabilityStatus: input.availabilityStatus || null,
    waitlistText: input.waitlistText || null,
    services: input.services,
    languages: input.languages
  };

  if (user.linkedProviderId) {
    return prisma.provider.update({
      where: { id: user.linkedProviderId },
      data
    });
  }

  const provider = await prisma.provider.create({ data });

  await prisma.user.update({
    where: { id: userId },
    data: { linkedProviderId: provider.id }
  });

  return provider;
}

export async function getProviderInquiries(providerId: string) {
  return prisma.match.findMany({
    where: { providerId },
    orderBy: { createdAt: "desc" },
    include: {
      intake: {
        select: {
          id: true,
          contactName: true,
          preferredArea: true,
          careTypes: true,
          urgency: true,
          ageRange: true,
          phone: true,
          email: true
        }
      }
    }
  });
}

export async function getProviderDashboardData(userId: string) {
  const provider = await getUserLinkedProvider(userId);
  const inquiries = provider ? await getProviderInquiries(provider.id) : [];

  return {
    provider,
    inquiries: inquiries.map((match) => ({
      id: match.id,
      score: match.score,
      status: match.status,
      notes: match.notes,
      createdAt: match.createdAt.toISOString(),
      intake: match.intake
    }))
  };
}
