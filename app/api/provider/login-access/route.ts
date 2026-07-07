import { providerLoginErrorMessage } from "@/lib/auth/provider-login-errors";
import { jsonError, jsonOk, handleApiError, readJsonBody } from "@/lib/core/api-helpers";
import { resolveProviderLoginAccess } from "@/lib/providers/invite-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await readJsonBody(request, 8_000)) as { email?: unknown; invite?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const inviteToken = typeof body.invite === "string" ? body.invite.trim() : "";

    if (!email || !email.includes("@")) {
      return jsonError("Enter a valid facility email address.", 400);
    }

    const access = await resolveProviderLoginAccess(email, inviteToken || null);
    if (!access.allowed) {
      const message = providerLoginErrorMessage(access.code);
      return jsonError(message || "Your facility account is not approved yet.", 403, { code: access.code });
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error, "provider_login_access");
  }
}
