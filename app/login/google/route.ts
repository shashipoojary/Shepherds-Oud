import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { sanitizeCallbackPath } from "@/lib/auth/routes";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedDestination = sanitizeCallbackPath(searchParams.get("callbackUrl"));
  const invite = searchParams.get("invite");
  const callbackURL =
    requestedDestination?.startsWith("/login/continue")
      ? requestedDestination
      : requestedDestination
        ? `/login/continue?callbackUrl=${encodeURIComponent(requestedDestination)}${invite ? `&invite=${encodeURIComponent(invite)}` : ""}`
        : "/login/continue";
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", requestedDestination || "/login/continue");

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    loginUrl.searchParams.set("error", "oauth-config");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const result = await auth.api.signInSocial({
      body: {
        provider: "google",
        callbackURL
      },
      headers: await headers()
    });

    if (result.url) {
      return NextResponse.redirect(result.url);
    }
  } catch (error) {
    console.error("Google sign-in failed", error);
  }

  loginUrl.searchParams.set("error", "oauth");
  return NextResponse.redirect(loginUrl);
}
