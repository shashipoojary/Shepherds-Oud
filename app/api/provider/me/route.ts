import { getServerSession, getUserRole } from "@/lib/auth-server";
import { logError } from "@/lib/logger";
import { handleApiError, jsonError, jsonOk, readJsonBody } from "@/lib/api-helpers";
import { providerSaveErrorMessage } from "@/lib/provider-errors";
import { getProviderInquiries, getUserLinkedProvider, upsertProviderForUser } from "@/lib/provider-server";
import { providerProfileSchema } from "@/lib/validation/provider";

export const runtime = "nodejs";

async function assertProviderAccess() {
  const session = await getServerSession();
  if (!session) return { error: jsonError("Please sign in to manage your facility profile.", 401) };
  const role = getUserRole(session);
  if (role !== "PROVIDER") {
    return { error: jsonError("You do not have access to the provider dashboard.", 403) };
  }
  return { session };
}

export async function GET() {
  try {
    const auth = await assertProviderAccess();
    if (auth.error) return auth.error;
    const provider = await getUserLinkedProvider(auth.session!.user.id);
    const inquiries = provider ? await getProviderInquiries(provider.id) : [];

    return jsonOk({
      provider,
      inquiries: inquiries.map((match) => ({
        id: match.id,
        score: match.score,
        status: match.status,
        notes: match.notes,
        declineReason: match.declineReason,
        createdAt: match.createdAt.toISOString(),
        intake: match.intake
      }))
    });
  } catch (error) {
    return handleApiError(error, "provider_dashboard_read");
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await assertProviderAccess();
    if (auth.error) return auth.error;

    const body = await readJsonBody(request);
    const parsed = providerProfileSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstFieldError = Object.values(fieldErrors).flat()[0];
      return jsonError(firstFieldError || "Please check your facility profile details.", 400, {
        issues: parsed.error.flatten()
      });
    }

    const provider = await upsertProviderForUser(auth.session!.user.id, auth.session!.user.email, parsed.data);

    return jsonOk(provider);
  } catch (error) {
    logError("provider_profile_save", {
      message: error instanceof Error ? error.message : "Unknown provider save error"
    });
    return jsonError(providerSaveErrorMessage(error), 400);
  }
}
