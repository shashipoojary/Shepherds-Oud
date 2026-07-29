import { sendBrevoEmail } from "@/lib/email/brevo";
import { emailGreeting, formatEmailDate, resolveEmailLocale } from "@/lib/email/email-copy";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";
import type { Locale } from "@/lib/i18n/config";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

export async function sendHospitalInviteEmail(input: {
  email: string;
  contactName: string;
  hospitalName: string;
  token: string;
  expiresAt: Date;
  locale?: Locale;
}) {
  const locale = await resolveEmailLocale(input.locale);
  const inviteUrl = `${appUrl}/hospital/login?invite=${encodeURIComponent(input.token)}`;
  const expiresLabel = formatEmailDate(locale, input.expiresAt);
  const en = locale === "en";

  const copy = en
    ? {
        subject: `You're invited to refer families on Shepherds Oud`,
        preheader: `Join ${input.hospitalName} on Shepherds Oud`,
        eyebrow: "Hospital referral access",
        title: "You're invited",
        invited: (name: string) =>
          `Shepherds Oud invited you to submit care referrals for ${name}.`,
        hint: "Sign in with this email to open your hospital referral dashboard.",
        expires: (when: string) => `This invite expires on ${when}.`,
        cta: "Open hospital login",
        footerNote: "If you did not expect this invite, you can ignore this email."
      }
    : {
        subject: `U bent uitgenodigd om families te verwijzen via Shepherds Oud`,
        preheader: `Sluit aan bij ${input.hospitalName} op Shepherds Oud`,
        eyebrow: "Ziekenhuisverwijzing",
        title: "U bent uitgenodigd",
        invited: (name: string) =>
          `Shepherds Oud heeft u uitgenodigd om zorgverwijzingen in te dienen voor ${name}.`,
        hint: "Log in met dit e-mailadres om uw ziekenhuis-verwijzingsdashboard te openen.",
        expires: (when: string) => `Deze uitnodiging verloopt op ${when}.`,
        cta: "Open ziekenhuis-login",
        footerNote: "Als u deze uitnodiging niet verwachtte, kunt u deze e-mail negeren."
      };

  const paragraphs = [
    emailGreeting(locale, input.contactName),
    copy.invited(input.hospitalName),
    copy.hint,
    copy.expires(expiresLabel)
  ];

  const htmlContent = renderTransactionalEmail({
    locale,
    preheader: copy.preheader,
    eyebrow: copy.eyebrow,
    title: copy.title,
    paragraphs,
    cta: { label: copy.cta, url: inviteUrl },
    footerNote: copy.footerNote
  });

  const textContent = [...paragraphs, "", `${copy.cta}: ${inviteUrl}`].join("\n");

  const result = await sendBrevoEmail({
    to: [{ email: input.email, name: input.contactName }],
    subject: copy.subject,
    htmlContent,
    textContent
  });

  if (result.mode === "demo") {
    console.info(`[dev] Hospital invite for ${input.email}: ${inviteUrl}`);
  }

  return result;
}
