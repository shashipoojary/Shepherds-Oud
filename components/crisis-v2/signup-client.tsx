"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";
import { authClient } from "@/lib/auth/client";
import { crisisV2Ui } from "@/lib/i18n/crisis-v2-ui";

type Phase = "checking" | "guest" | "claiming" | "error";

export function SignupClient({
  initialPhase,
  initialSignedIn = false,
  initialMessage = ""
}: {
  initialPhase?: Phase;
  initialSignedIn?: boolean;
  initialMessage?: string;
}) {
  const { locale } = useLocale();
  const ui = crisisV2Ui(locale);
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(initialPhase ?? "checking");
  const [signedIn, setSignedIn] = useState(initialSignedIn);
  const [message, setMessage] = useState(initialMessage);

  useEffect(() => {
    if (initialPhase) return;

    let cancelled = false;

    async function claim() {
      const response = await fetch("/api/v2/cases/claim", { method: "POST" });
      const data = (await response.json()) as { caseId?: string; error?: string };
      if (cancelled) return;
      if (!response.ok) {
        setPhase("error");
        setMessage(data.error || "Could not save your triage to this account.");
        return;
      }
      router.push("/patient");
    }

    void authClient.getSession().then((result) => {
      if (cancelled) return;
      if (!result.data?.user) {
        setSignedIn(false);
        setPhase("guest");
        return;
      }
      setSignedIn(true);
      setPhase("claiming");
      void claim();
    });

    return () => {
      cancelled = true;
    };
  }, [router, initialPhase]);

  return (
    <section className="mx-auto max-w-md">
      <div className="rounded-2xl bg-white p-5 shadow-soft sm:p-8">
        <h1 className="font-brand text-2xl font-semibold text-ink">{ui.signup.title}</h1>
        <p className="mt-2 text-sm leading-6 text-ink/70">{ui.signup.intro}</p>

        {phase === "checking" || phase === "claiming" ? (
          <p className="mt-6 text-sm text-ink/60">
            {phase === "claiming" ? "Saving your result…" : "Checking your session…"}
          </p>
        ) : null}

        {phase === "error" && message ? <p className="mt-4 text-sm text-red-700">{message}</p> : null}

        {phase === "error" && signedIn ? (
          <Button asChild className="mt-6" variant="outline">
            <Link href="/triage/1">{ui.landing.cta}</Link>
          </Button>
        ) : null}

        {phase === "guest" ? (
          <div className="mt-6">
            <AuthLoginForm intent="family" />
            <p className="mt-6 text-center text-xs text-ink/50">
              After sign-in you return here to attach your triage result.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
