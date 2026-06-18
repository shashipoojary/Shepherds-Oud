import { prisma } from "@/lib/db";

export async function resolveDefaultCareGuideId() {
  const advisorEmail = process.env.ADVISOR_EMAIL?.trim().toLowerCase();
  if (advisorEmail) {
    const advisor = await prisma.user.findFirst({
      where: { email: advisorEmail, role: "ADMIN" },
      select: { id: true }
    });
    if (advisor) return advisor.id;
  }

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true }
  });

  return admin?.id ?? null;
}
