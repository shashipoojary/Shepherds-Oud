"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/components/i18n/locale-provider";
import { productUi } from "@/lib/i18n/ui";
import type { Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { TOAST_DISMISS_MS } from "@/lib/client/toast-timing";
import { PROVIDER_DASHBOARD_PATH } from "@/lib/auth/routes";
import { providerLoginErrorMessage } from "@/lib/auth/provider-login-errors";

function errorMessage(code: string | null, isProvider: boolean, locale: Locale, ui: ReturnType<typeof productUi>) {
  if (code === "unauthorized") {
    return isProvider ? ui.auth.providerAccountNeeded : ui.auth.adminOnly;
  }

  if (code === "oauth-config") {
    return ui.auth.oauthNotConfigured;
  }

  if (code === "oauth") {
    return ui.auth.oauthFailed;
  }

  if (code === "magic-link") {
    return ui.auth.invalidLink;
  }

  const providerMessage = providerLoginErrorMessage(code, locale);
  if (providerMessage) {
    return providerMessage;
  }

  return null;
}

type AuthLoginFormProps = {
  intent?: "family" | "provider" | "admin";
};

export function AuthLoginForm({ intent }: AuthLoginFormProps) {
  const { locale, ui } = useLocale();
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
  const message = errorMessage(error, Boolean(isProvider), locale, ui);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [emailFeedback, setEmailFeedback] = useState("");
  const [emailFeedbackTone, setEmailFeedbackTone] = useState<"success" | "error">("success");
  const googleLoginParams = new URLSearchParams();
  if (requestedDestination) {
    googleLoginParams.set("callbackUrl", requestedDestination);
  }
  if (isProvider && inviteParam) {
    googleLoginParams.set("invite", inviteParam);
  }
  const googleLoginHref = `/login/google${googleLoginParams.size ? `?${googleLoginParams.toString()}` : ""}`;

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
      setEmailFeedback(ui.auth.invalidEmail);
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
          setEmailFeedback(data?.error || ui.auth.providerNotApproved);
          return;
        }
      }

      const { error: signInError } = await authClient.signIn.magicLink({
        email: trimmed,
        callbackURL: callbackUrl,
        errorCallbackURL: isFamily
          ? "/family/login?error=magic-link"
          : inviteParam
            ? `/provider/login?invite=${encodeURIComponent(inviteParam)}&error=magic-link`
            : "/provider/login?error=magic-link"
      });

      if (signInError) {
        setEmailFeedbackTone("error");
        const errorRecord = signInError as { message?: string; status?: number; error?: { message?: string } };
        const serverMessage = errorRecord.message || errorRecord.error?.message || "";
        setEmailFeedback(serverMessage || ui.auth.sendFailed);
        return;
      }

      setEmailFeedbackTone("success");
      setEmailFeedback(ui.auth.linkSent(trimmed));
    } catch {
      setEmailFeedbackTone("error");
      setEmailFeedback(ui.auth.sendFailed);
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
            {ui.auth.providerInviteHint}
          </p>
        ) : null}

        <label className="grid gap-2 text-sm font-medium text-ink">
          {ui.auth.emailLabel}
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
              {ui.auth.sendingLink}
            </>
          ) : (
            ui.auth.emailLink
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
          <span>{ui.auth.or}</span>
          <span className="h-px flex-1 bg-stone-200" />
        </div>

        <Button type="button" variant="outline" onClick={startGoogleSignIn} disabled={loadingGoogle || loadingEmail} className="w-full">
          {loadingGoogle ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {ui.auth.redirectingGoogle}
            </>
          ) : (
            ui.auth.continueGoogle
          )}
        </Button>

        <p className="text-center text-xs leading-5 text-neutral-500">
          {ui.auth.workEmailHint}
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
            {ui.auth.redirectingGoogle}
          </>
        ) : (
          ui.auth.continueGoogle
        )}
      </Button>

      <p className="text-center text-xs leading-5 text-neutral-500">
        {ui.auth.adminOnly}
      </p>
    </div>
  );
}
