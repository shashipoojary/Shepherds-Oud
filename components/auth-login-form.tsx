"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function AuthLoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const error = searchParams.get("error");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function signInWithGoogle() {
    setLoading(true);
    setMessage(null);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackUrl
      });
    } catch {
      setMessage("Sign-in failed. Check your Google OAuth settings and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      {error === "unauthorized" ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your account is signed in, but it does not have access to that page yet. Ask an admin to add your email to the
          allow list.
        </p>
      ) : null}

      {message ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{message}</p>
      ) : null}

      <Button type="button" onClick={signInWithGoogle} disabled={loading} className="w-full">
        {loading ? "Redirecting to Google..." : "Continue with Google"}
      </Button>

      <p className="text-center text-xs leading-5 text-neutral-500">
        Admin and provider access is limited to approved Google accounts.
      </p>
    </div>
  );
}
