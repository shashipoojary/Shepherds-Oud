import { getServerSession, getUserRole } from "@/lib/auth/server";
import { logError } from "@/lib/core/logger";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody } from "@/lib/core/api-helpers";
import { providerSaveErrorMessage } from "@/lib/providers/errors";
import { getProviderInquiries, getUserLinkedProvider, upsertProviderForUser } from "@/lib/providers/server";
import { getProviderProfileMissingRequirements } from "@/lib/providers/completeness";
import { toSafeProvider, toSafeProviderInquiry } from "@/lib/serializers/provider";
import { providerProfileSchemaFor } from "@/lib/validation/provider";
import { getLocale } from "@/lib/i18n/get-locale";

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

export async function GET(request: Request) {
  const limited = rateLimitResponse(request, "provider-me-read", 120, 60 * 1000);
  if (limited) return limited;

  try {
    const auth = await assertProviderAccess();
    if (auth.error) return auth.error;
    const provider = await getUserLinkedProvider(auth.session!.user.id);
    const profileMissingRequirements = getProviderProfileMissingRequirements(provider);
    const profileComplete = profileMissingRequirements.length === 0;
    const inquiries = provider && profileComplete ? await getProviderInquiries(provider.id) : [];

    return jsonOk({
      provider: toSafeProvider(provider),
      profileComplete,
      profileMissingRequirements,
      inquiries: inquiries.map(toSafeProviderInquiry)
    });
  } catch (error) {
    return handleApiError(error, "provider_dashboard_read");
  }
}

export async function PATCH(request: Request) {
  const limited = rateLimitResponse(request, "provider-me-update", 30, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const auth = await assertProviderAccess();
    if (auth.error) return auth.error;

    const body = await readJsonBody(request);
    const locale = await getLocale();
    const parsed = providerProfileSchemaFor(locale).safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstFieldError = Object.values(fieldErrors).flat()[0];
      return jsonError(firstFieldError || "Please check your facility profile details.", 400, {
        issues: parsed.error.flatten()
      });
    }

    const provider = await upsertProviderForUser(auth.session!.user.id, auth.session!.user.email, parsed.data);
    const profileMissingRequirements = getProviderProfileMissingRequirements(provider);

    return jsonOk({
      provider: toSafeProvider(provider),
      profileComplete: profileMissingRequirements.length === 0,
      profileMissingRequirements,
      inquiries: []
    });
  } catch (error) {
    logError("provider_profile_save", {
      message: error instanceof Error ? error.message : "Unknown provider save error"
    });
    return jsonError(providerSaveErrorMessage(error), 400);
  }
}
