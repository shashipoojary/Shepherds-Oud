import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callbackURL = searchParams.get("callbackUrl") || "/admin";
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", callbackURL);

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
