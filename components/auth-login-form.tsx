"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function errorMessage(code: string | null) {
  if (code === "unauthorized") {
    return "Your account is signed in, but it does not have access to that page yet. Ask an admin to add your email to ADMIN_EMAILS in Vercel.";
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
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
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
        Admin and provider access is limited to approved Google accounts.
      </p>
    </div>
  );
}
