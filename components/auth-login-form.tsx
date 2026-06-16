"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function errorMessage(code: string | null) {
  if (code === "unauthorized") {
    return "This page is for a different account type. Admins use ADMIN_EMAILS; care facilities use PROVIDER_EMAILS in Vercel. Contact your Shepherds Oud administrator.";
  }

  if (code === "oauth-config") {
    return "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel, then redeploy.";
  }

  if (code === "oauth") {
    return "Google sign-in failed. Confirm your Supabase tables exist and the Google redirect URI is https://shepherds-oud.vercel.app/api/auth/callback/google.";
  }

  return null;
}

export function AuthLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedDestination = searchParams.get("callbackUrl");
  const callbackUrl = requestedDestination
    ? `/login/continue?callbackUrl=${encodeURIComponent(requestedDestination)}`
    : "/login/continue";
  const error = searchParams.get("error");
  const message = errorMessage(error);
  const [loading, setLoading] = useState(false);
  const googleLoginHref = `/login/google?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  function startGoogleSignIn() {
    setLoading(true);
    router.push(googleLoginHref);
  }

  return (
    <div className="grid gap-4">
      {message ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{message}</p>
      ) : null}

      <Button type="button" onClick={startGoogleSignIn} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecting to Google...
          </>
        ) : (
          "Continue with Google"
        )}
      </Button>

      <p className="text-center text-xs leading-5 text-neutral-500">
        One Google sign-in for all staff. Your email decides your role: admin advisors see the admin panel; care facilities see the provider dashboard.
      </p>
    </div>
  );
}
