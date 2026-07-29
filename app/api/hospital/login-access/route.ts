import { NextResponse } from "next/server";
import { getLocale } from "@/lib/i18n/get-locale";
import {
  hospitalLoginErrorFromAccessCode,
  hospitalLoginErrorMessage
} from "@/lib/auth/hospital-login-errors";
import { resolveHospitalLoginAccess } from "@/lib/hospitals/invite";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string; invite?: string };
    const locale = await getLocale();
    const access = await resolveHospitalLoginAccess(body.email, body.invite);

    if (!access.allowed) {
      return NextResponse.json(
        {
          error: hospitalLoginErrorMessage(hospitalLoginErrorFromAccessCode(access.code), locale)
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to check hospital login access.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
