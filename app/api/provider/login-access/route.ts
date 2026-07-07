import { isProviderMagicLinkAllowedEmail } from "@/lib/auth/roles";
import {
  PROVIDER_ACCOUNT_NOT_FOUND_MESSAGE,
  PROVIDER_INVITE_EMAIL_MISMATCH_MESSAGE,
  PROVIDER_LOGIN_ERROR
} from "@/lib/auth/provider-login-errors";
import { jsonError, jsonOk, handleApiError, readJsonBody } from "@/lib/core/api-helpers";
import { findPendingProviderInviteByToken } from "@/lib/providers/invite";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await readJsonBody(request, 8_000)) as { email?: unknown; invite?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const inviteToken = typeof body.invite === "string" ? body.invite.trim() : "";

    if (!email || !email.includes("@")) {
      return jsonError("Enter a valid facility email address.", 400);
    }

    if (inviteToken) {
      const invite = await findPendingProviderInviteByToken(inviteToken);
      if (!invite) {
        if (await isProviderMagicLinkAllowedEmail(email)) {
          return jsonOk({ ok: true });
        }
        return jsonError(PROVIDER_ACCOUNT_NOT_FOUND_MESSAGE, 403, { code: PROVIDER_LOGIN_ERROR.PENDING });
      }
      if (invite.email.trim().toLowerCase() !== email) {
        return jsonError(PROVIDER_INVITE_EMAIL_MISMATCH_MESSAGE, 403, {
          code: PROVIDER_LOGIN_ERROR.INVITE_EMAIL
        });
      }
      return jsonOk({ ok: true });
    }

    if (await isProviderMagicLinkAllowedEmail(email)) {
      return jsonOk({ ok: true });
    }

    return jsonError(PROVIDER_ACCOUNT_NOT_FOUND_MESSAGE, 403, { code: PROVIDER_LOGIN_ERROR.PENDING });
  } catch (error) {
    return handleApiError(error, "provider_login_access");
  }
}
