import { isProviderMagicLinkAllowedEmail } from "@/lib/auth/roles";
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
        return jsonError("That provider invite is invalid or has expired.", 403, { code: "invite" });
      }
      if (invite.email.trim().toLowerCase() !== email) {
        return jsonError("This invite belongs to a different email address. Sign in with the invited email.", 403, {
          code: "invite-email"
        });
      }
      return jsonOk({ ok: true });
    }

    if (await isProviderMagicLinkAllowedEmail(email)) {
      return jsonOk({ ok: true });
    }

    return jsonError(
      "Your facility account is not approved yet. Use the invited email from Shepherds Oud, or join the facility waitlist so our team can review your provider profile.",
      403,
      { code: "provider-pending" }
    );
  } catch (error) {
    return handleApiError(error, "provider_login_access");
  }
}
