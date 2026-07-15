import { getServerSession, getUserRole } from "@/lib/auth/server";
import { handleApiError, jsonError, jsonOk, readJsonBody } from "@/lib/core/api-helpers";
import { prisma } from "@/lib/core/db";
import { adminProviderNotesSchema } from "@/lib/validation/admin-provider";

export const runtime = "nodejs";

async function assertAdmin() {
  const session = await getServerSession();
  if (!session || getUserRole(session) !== "ADMIN") {
    return { error: jsonError("Forbidden", 403) };
  }
  return { session };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await assertAdmin();
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const body = await readJsonBody(request);
    const parsed = adminProviderNotesSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid provider update.", 400, { issues: parsed.error.flatten() });
    }

    const existing = await prisma.provider.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existing) {
      return jsonError("Provider not found.", 404);
    }

    const data = parsed.data;
    const provider = await prisma.provider.update({
      where: { id },
      data: {
        ...(data.adminNotes !== undefined ? { adminNotes: data.adminNotes?.trim() || null } : {}),
        ...(data.verificationStatus !== undefined ? { verificationStatus: data.verificationStatus } : {}),
        ...(data.legalOrganisationName !== undefined
          ? { legalOrganisationName: data.legalOrganisationName?.trim() || null }
          : {}),
        ...(data.kvkNumber !== undefined ? { kvkNumber: data.kvkNumber?.trim() || null } : {}),
        ...(data.agbCode !== undefined ? { agbCode: data.agbCode?.trim() || null } : {}),
        ...(data.wtzaStatus !== undefined ? { wtzaStatus: data.wtzaStatus?.trim() || null } : {}),
        ...(data.roomTypes !== undefined
          ? {
              roomTypes: data.roomTypes
                .map((item) => item.trim())
                .filter(Boolean)
            }
          : {})
      },
      select: {
        id: true,
        adminNotes: true,
        verificationStatus: true,
        legalOrganisationName: true,
        kvkNumber: true,
        agbCode: true,
        wtzaStatus: true,
        roomTypes: true,
        updatedAt: true
      }
    });

    return jsonOk({
      id: provider.id,
      adminNotes: provider.adminNotes,
      verificationStatus: provider.verificationStatus,
      legalOrganisationName: provider.legalOrganisationName,
      kvkNumber: provider.kvkNumber,
      agbCode: provider.agbCode,
      wtzaStatus: provider.wtzaStatus,
      roomTypes: provider.roomTypes,
      updatedAt: provider.updatedAt.toISOString()
    });
  } catch (error) {
    return handleApiError(error, "admin_provider_update");
  }
}
