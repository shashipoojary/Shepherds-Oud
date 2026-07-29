import { siteTagline } from "@/lib/config/marketing-en";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { sendAdvisorAlertEmail } from "@/lib/email/advisor-alert-email";
import { emailGreeting, resolveEmailLocale } from "@/lib/email/email-copy";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";
import type { Locale } from "@/lib/i18n/config";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

export async function sendHospitalReferralFamilyEmails(input: {
  contactName: string;
  email: string;
  intakeId: string;
  hospitalName: string;
  locale?: Locale;
}) {
  const locale = await resolveEmailLocale(input.locale);
  const en = locale === "en";
  const dashboardUrl = `${appUrl}/family/login?callbackUrl=${encodeURIComponent("/family/dashboard")}`;
  const reference = input.intakeId.slice(0, 8).toUpperCase();

  const copy = en
    ? {
        subject: `A care referral was submitted for you — Shepherds Oud`,
        preheader: `${input.hospitalName} referred you for care navigation`,
        eyebrow: "Hospital referral",
        title: "Your care request is with us",
        body: (hospital: string) =>
          `${hospital} submitted a care referral for you to Shepherds Oud. A Care Guide will follow up.`,
        signIn:
          "Sign in with this email to open your family dashboard, track progress, and message your Care Guide when assigned.",
        cta: "Open family dashboard",
        footerNote: (ref: string) => `Reference ${ref}. If you did not expect this, contact Shepherds Oud.`
      }
    : {
        subject: `Er is een zorgverwijzing voor u ingediend — Shepherds Oud`,
        preheader: `${input.hospitalName} heeft u verwezen voor zorgnavigatie`,
        eyebrow: "Ziekenhuisverwijzing",
        title: "Uw zorgaanvraag is bij ons",
        body: (hospital: string) =>
          `${hospital} heeft een zorgverwijzing voor u ingediend bij Shepherds Oud. Een Care Guide volgt dit op.`,
        signIn:
          "Log in met dit e-mailadres om uw familiedashboard te openen, de voortgang te volgen en contact te hebben met uw Care Guide.",
        cta: "Open familiedashboard",
        footerNote: (ref: string) => `Referentie ${ref}. Als u dit niet verwachtte, neem contact op met Shepherds Oud.`
      };

  const paragraphs = [
    emailGreeting(locale, input.contactName),
    copy.body(input.hospitalName),
    copy.signIn,
    siteTagline(locale)
  ];

  const familyHtml = renderTransactionalEmail({
    locale,
    preheader: copy.preheader,
    eyebrow: copy.eyebrow,
    title: copy.title,
    paragraphs,
    cta: { label: copy.cta, url: dashboardUrl },
    footerNote: copy.footerNote(reference)
  });

  await Promise.allSettled([
    sendBrevoEmail({
      to: [{ email: input.email, name: input.contactName }],
      subject: copy.subject,
      htmlContent: familyHtml,
      textContent: [...paragraphs, "", `${copy.cta}: ${dashboardUrl}`].join("\n")
    }),
    sendAdvisorAlertEmail({
      kind: "new_intake",
      detail: input.contactName,
      paragraphs: [
        `Hospital referral from ${input.hospitalName} for ${input.contactName} (${input.email}).`,
        `Reference: ${reference}.`,
        "No Care Guide assigned yet — appears in Families with a Hospital badge."
      ]
    })
  ]);
}
