import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * TEMPORARY — remove after Better Auth Dash key comparison.
 * Masked fingerprint only: length + first/last 4 chars. Never returns the full key.
 *
 * GET /api/debug/better-auth-key
 * Optional: ?token=<CRON_SECRET> when CRON_SECRET is set (recommended).
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const token = new URL(request.url).searchParams.get("token");
    if (token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const raw = process.env.BETTER_AUTH_API_KEY;
  const present = typeof raw === "string" && raw.length > 0;
  const value = present ? raw : "";
  const trimmed = value.trim();
  const hasWhitespacePadding = present && value !== trimmed;

  const fingerprint =
    trimmed.length >= 8
      ? {
          length: trimmed.length,
          first4: trimmed.slice(0, 4),
          last4: trimmed.slice(-4)
        }
      : present
        ? {
            length: trimmed.length,
            first4: trimmed.slice(0, Math.min(4, trimmed.length)),
            last4: trimmed.slice(-Math.min(4, trimmed.length)),
            note: "Key shorter than 8 characters"
          }
        : null;

  console.info("[debug/better-auth-key]", {
    present,
    hasWhitespacePadding,
    length: fingerprint?.length ?? 0,
    first4: fingerprint?.first4 ?? null,
    last4: fingerprint?.last4 ?? null
  });

  return NextResponse.json(
    {
      temporary: true,
      removeAfterConfirm: true,
      present,
      hasWhitespacePadding,
      fingerprint,
      tip: cronSecret
        ? "Pass ?token=<CRON_SECRET> when calling this endpoint."
        : "CRON_SECRET is unset — this endpoint is unauthenticated. Set CRON_SECRET or remove after use."
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
