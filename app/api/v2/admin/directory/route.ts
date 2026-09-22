import { getServerSession, getUserRole } from "@/lib/auth/server";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody } from "@/lib/core/api-helpers";
import { prisma } from "@/lib/core/db";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const limited = rateLimitResponse(request, "v2-admin-directory-link", 60, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const session = await getServerSession();
    if (!session || getUserRole(session) !== "ADMIN") {
      return jsonError("Forbidden", 403);
    }

    const body = (await readJsonBody(request, 4_000)) as {
      directoryProviderId?: string;
      linkedProviderId?: string | null;
    };

    if (!body.directoryProviderId) return jsonError("directoryProviderId is required.", 400);
    if (body.linkedProviderId === undefined) {
      return jsonError("linkedProviderId is required (string or null).", 400);
    }

    const listing = await prisma.directoryProvider.findUnique({
      where: { id: body.directoryProviderId },
      select: { id: true, name: true }
    });
    if (!listing) return jsonError("Directory listing not found.", 404);

    if (body.linkedProviderId === null) {
      const updated = await prisma.directoryProvider.update({
        where: { id: listing.id },
        data: { linkedProviderId: null },
        select: {
          id: true,
          linkedProviderId: true,
          linkedProvider: { select: { id: true, name: true, email: true } }
        }
      });
      return jsonOk({
        directoryProviderId: updated.id,
        linkedProviderId: null,
        linkedProviderName: null,
        linkedProviderEmail: null
      });
    }

    const provider = await prisma.provider.findUnique({
      where: { id: body.linkedProviderId },
      select: { id: true, name: true, email: true }
    });
    if (!provider) return jsonError("Provider account not found.", 404);

    const alreadyLinked = await prisma.directoryProvider.findFirst({
      where: {
        linkedProviderId: provider.id,
        id: { not: listing.id }
      },
      select: { id: true, name: true }
    });
    if (alreadyLinked) {
      return jsonError(
        `That provider account is already linked to “${alreadyLinked.name}”. Unlink it first.`,
        409
      );
    }

    const updated = await prisma.directoryProvider.update({
      where: { id: listing.id },
      data: { linkedProviderId: provider.id },
      select: {
        id: true,
        linkedProviderId: true,
        linkedProvider: { select: { id: true, name: true, email: true } }
      }
    });

    return jsonOk({
      directoryProviderId: updated.id,
      linkedProviderId: updated.linkedProviderId,
      linkedProviderName: updated.linkedProvider?.name || provider.name,
      linkedProviderEmail: updated.linkedProvider?.email || provider.email
    });
  } catch (error) {
    return handleApiError(error, "v2_admin_directory_link");
  }
}
