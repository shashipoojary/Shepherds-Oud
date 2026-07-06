"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { TOAST_DISMISS_MS } from "@/lib/client/toast-timing";
import { PROVIDER_DASHBOARD_PATH } from "@/lib/auth/routes";

function errorMessage(code: string | null, isProvider: boolean) {
  if (code === "unauthorized") {
    return isProvider
      ? "You need a care facility account for this page. Use List your facility to sign in."
      : "This page is for administrators only. Use your approved admin Google account.";
  }

  if (code === "oauth-config") {
    return "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel, then redeploy.";
  }

  if (code === "oauth") {
    return "Google sign-in could not be completed. Please try again or contact support.";
  }

  if (code === "magic-link") {
    return "That sign-in link is invalid or has expired. Request a new link below.";
  }

  if (code === "invite") {
    return "That provider invite is invalid or has expired. Ask the Shepherds Oud team to send a new invite.";
  }

  if (code === "invite-email") {
    return "This invite belongs to a different email address. Sign in with the invited email or ask for a new invite.";
  }

  if (code === "provider-pending") {
    return "Your facility account is not approved yet. Use the invited email from Shepherds Oud, or join the facility waitlist so our team can review your provider profile.";
  }

  return null;
}

type AuthLoginFormProps = {
  intent?: "family" | "provider" | "admin";
};

export function AuthLoginForm({ intent }: AuthLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackParam = searchParams.get("callbackUrl");
  const inviteParam = searchParams.get("invite");
  const familyDestination = callbackParam?.startsWith("/family") ? callbackParam : "/family/dashboard";
  const adminDestination = callbackParam?.startsWith("/admin") ? callbackParam : "/admin";
  const requestedDestination =
    intent === "provider"
      ? PROVIDER_DASHBOARD_PATH
      : intent === "family"
        ? familyDestination
        : intent === "admin"
          ? adminDestination
          : callbackParam;
  const isProvider = intent === "provider" || requestedDestination?.startsWith(PROVIDER_DASHBOARD_PATH);
  const isFamily = intent === "family" || requestedDestination?.startsWith("/family");
  const callbackUrlParams = new URLSearchParams();
  if (requestedDestination) {
    callbackUrlParams.set("callbackUrl", requestedDestination);
  }
  if (isProvider && inviteParam) {
    callbackUrlParams.set("invite", inviteParam);
  }
  const callbackUrl = callbackUrlParams.size ? `/login/continue?${callbackUrlParams.toString()}` : "/login/continue";
  const error = searchParams.get("error");
  const message = errorMessage(error, Boolean(isProvider));
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [emailFeedback, setEmailFeedback] = useState("");
  const [emailFeedbackTone, setEmailFeedbackTone] = useState<"success" | "error">("success");
  const googleLoginHref = `/login/google?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  function startGoogleSignIn() {
    setLoadingGoogle(true);
    router.push(googleLoginHref);
  }

  useEffect(() => {
    if (!emailFeedback) return;
    const timer = window.setTimeout(() => setEmailFeedback(""), TOAST_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [emailFeedback]);

  async function sendEmailSignInLink() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setEmailFeedbackTone("error");
      setEmailFeedback("Enter a valid email address.");
      return;
    }

    setLoadingEmail(true);
    setEmailFeedback("");

    try {
      if (isProvider) {
        const accessResponse = await fetch("/api/provider/login-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed, invite: inviteParam || undefined })
        });

        if (!accessResponse.ok) {
          const data = (await accessResponse.json().catch(() => null)) as { error?: string } | null;
          setEmailFeedbackTone("error");
          setEmailFeedback(data?.error || "Your facility account is not approved yet.");
          return;
        }
      }

      const { error: signInError } = await authClient.signIn.magicLink({
        email: trimmed,
        callbackURL: callbackUrl,
        errorCallbackURL: isFamily ? "/family/login?error=magic-link" : "/provider/login?error=magic-link"
      });

      if (signInError) {
        setEmailFeedbackTone("error");
        const serverMessage =
          typeof signInError === "object" && signInError && "message" in signInError && typeof signInError.message === "string"
            ? signInError.message
            : "";
        setEmailFeedback(serverMessage || "Could not send sign-in link.");
        return;
      }

      setEmailFeedbackTone("success");
      setEmailFeedback(`Sign-in link sent to ${trimmed}. Open it on this device within 15 minutes.`);
    } catch {
      setEmailFeedbackTone("error");
      setEmailFeedback("Could not send sign-in link. Please try again.");
    } finally {
      setLoadingEmail(false);
    }
  }

  if (isProvider || isFamily) {
    return (
      <div className="grid gap-4">
        {message ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{message}</p>
        ) : null}
        {isProvider && inviteParam ? (
          <p className="rounded-xl border border-brand-green-pale bg-brand-green-pale/20 px-4 py-3 text-sm leading-6 text-brand-green-dark">
            Use the invited facility email to finish onboarding. After sign-in, you will land on your provider dashboard.
          </p>
        ) : null}

        <label className="grid gap-2 text-sm font-medium text-ink">
          Email address
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={isFamily ? "you@example.com" : "you@facility.nl"}
            className="rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-normal outline-brand-amber"
          />
        </label>

        <Button type="button" onClick={() => void sendEmailSignInLink()} disabled={loadingEmail || loadingGoogle} className="w-full">
          {loadingEmail ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending link...
            </>
          ) : (
            "Email me a sign-in link"
          )}
        </Button>

        {emailFeedback ? (
          <p
            className={`rounded-xl px-4 py-3 text-sm ${
              emailFeedbackTone === "success"
                ? "border border-brand-green-pale bg-brand-green-pale/20 text-brand-green-dark"
                : "border border-red-200 bg-red-50 text-red-800"
            }`}
            role="status"
          >
            {emailFeedback}
          </p>
        ) : null}

        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-neutral-400">
          <span className="h-px flex-1 bg-stone-200" />
          <span>or</span>
          <span className="h-px flex-1 bg-stone-200" />
        </div>

        <Button type="button" variant="outline" onClick={startGoogleSignIn} disabled={loadingGoogle || loadingEmail} className="w-full">
          {loadingGoogle ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting to Google...
            </>
          ) : (
            "Continue with Google"
          )}
        </Button>

        <p className="text-center text-xs leading-5 text-neutral-500">
          Use your facility work email — Gmail, Microsoft, Apple, or your own domain.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {message ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{message}</p>
      ) : null}

      <Button type="button" onClick={startGoogleSignIn} disabled={loadingGoogle} className="w-full">
        {loadingGoogle ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecting to Google...
          </>
        ) : (
          "Continue with Google"
        )}
      </Button>

      <p className="text-center text-xs leading-5 text-neutral-500">
        Administrator access is limited to approved Care Guide accounts.
      </p>
    </div>
  );
}
