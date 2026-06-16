"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROVIDER_DASHBOARD_PATH } from "@/lib/auth-routes";

function errorMessage(code: string | null, isProvider: boolean) {
  if (code === "unauthorized") {
    return isProvider
      ? "You need a care facility account for this page. Use List your facility to sign in with Google."
      : "This page is for administrators only. Use your approved admin Google account.";
  }

  if (code === "oauth-config") {
    return "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel, then redeploy.";
  }

  if (code === "oauth") {
    return "Google sign-in failed. Confirm your Supabase tables exist and the Google redirect URI is https://shepherds-oud.vercel.app/api/auth/callback/google.";
  }

  return null;
}

type AuthLoginFormProps = {
  intent?: "provider" | "admin";
};

export function AuthLoginForm({ intent }: AuthLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedDestination = intent === "provider" ? PROVIDER_DASHBOARD_PATH : searchParams.get("callbackUrl");
  const isProvider = intent === "provider" || requestedDestination?.startsWith(PROVIDER_DASHBOARD_PATH);
  const callbackUrl = requestedDestination
    ? `/login/continue?callbackUrl=${encodeURIComponent(requestedDestination)}`
    : "/login/continue";
  const error = searchParams.get("error");
  const message = errorMessage(error, Boolean(isProvider));
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
        {isProvider
          ? "Any care home, assisted living, or home care agency can sign in with Google to list services. No approval email list required."
          : "Administrator access is limited to approved team accounts configured in ADMIN_EMAILS."}
      </p>
    </div>
  );
}
