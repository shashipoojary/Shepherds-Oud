import { providerLoginErrorMessage } from "@/lib/auth/provider-login-errors";
import { jsonError, jsonOk, handleApiError, rateLimitResponse, readJsonBody } from "@/lib/core/api-helpers";
import { resolveProviderLoginAccess } from "@/lib/providers/invite-access";
import { getLocale } from "@/lib/i18n/get-locale";
import { productUi } from "@/lib/i18n/ui";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "provider-login-access", 30, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const locale = await getLocale();
    const ui = productUi(locale);
    const body = (await readJsonBody(request, 8_000)) as { email?: unknown; invite?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const inviteToken = typeof body.invite === "string" ? body.invite.trim() : "";

    if (!email || !email.includes("@")) {
      return jsonError(ui.auth.invalidEmail, 400);
    }

    const access = await resolveProviderLoginAccess(email, inviteToken || null);
    if (!access.allowed) {
      const message = inviteToken
        ? providerLoginErrorMessage(access.code, locale) || ui.auth.providerNotApproved
        : ui.auth.providerNotApproved;
      return jsonError(message, 403, inviteToken ? { code: access.code } : undefined);
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error, "provider_login_access");
  }
}
