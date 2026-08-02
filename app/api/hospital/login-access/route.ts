import { NextResponse } from "next/server";
import { getLocale } from "@/lib/i18n/get-locale";
import {
  HOSPITAL_LOGIN_ERROR,
  hospitalLoginErrorFromAccessCode,
  hospitalLoginErrorMessage
} from "@/lib/auth/hospital-login-errors";
import { resolveHospitalLoginAccess } from "@/lib/hospitals/invite";
import { handleApiError, jsonError, jsonOk, rateLimitResponse, readJsonBody } from "@/lib/core/api-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, "hospital-login-access", 30, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = (await readJsonBody(request, 8_000)) as { email?: unknown; invite?: unknown };
    const locale = await getLocale();
    const email = typeof body.email === "string" ? body.email : undefined;
    const invite = typeof body.invite === "string" ? body.invite : undefined;
    const access = await resolveHospitalLoginAccess(email, invite);

    if (!access.allowed) {
      const accessCode = access.code ?? "not_found";
      const message =
        hospitalLoginErrorMessage(hospitalLoginErrorFromAccessCode(accessCode), locale) ||
        hospitalLoginErrorMessage(HOSPITAL_LOGIN_ERROR.NOT_FOUND, locale) ||
        "Access denied.";
      return jsonError(message, 403);
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error, "hospital_login_access");
  }
}
