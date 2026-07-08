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

    const provider = await prisma.provider.update({
      where: { id },
      data: { adminNotes: parsed.data.adminNotes?.trim() || null },
      select: {
        id: true,
        adminNotes: true,
        updatedAt: true
      }
    });

    return jsonOk({
      id: provider.id,
      adminNotes: provider.adminNotes,
      updatedAt: provider.updatedAt.toISOString()
    });
  } catch (error) {
    return handleApiError(error, "admin_provider_update");
  }
}
