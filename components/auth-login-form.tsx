"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

function errorMessage(code: string | null) {
  if (code === "unauthorized") {
    return "Your account is signed in, but it does not have access to that page yet. Ask an admin to add your email to ADMIN_EMAILS in Vercel.";
  }

  if (code === "oauth-config") {
    return "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel, then redeploy.";
  }

  if (code === "oauth") {
    return "Google sign-in failed. Check your Google OAuth redirect URI and database connection, then try again.";
  }

  return null;
}

export function AuthLoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const error = searchParams.get("error");
  const message = errorMessage(error);
  const googleLoginHref = `/login/google?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <div className="grid gap-4">
      {message ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{message}</p>
      ) : null}

      <Button asChild className="w-full">
        <Link href={googleLoginHref}>Continue with Google</Link>
      </Button>

      <p className="text-center text-xs leading-5 text-neutral-500">
        Admin and provider access is limited to approved Google accounts.
      </p>
    </div>
  );
}
