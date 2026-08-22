import { sendBrevoEmail } from "@/lib/email/brevo";
import { emailCopy, emailGreeting, resolveEmailLocale } from "@/lib/email/email-copy";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";
import type { Locale } from "@/lib/i18n/config";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

export async function buildWaitlistFamilyLaunchPayload(input: {
  contactName: string;
  email: string;
  locale?: Locale;
}) {
  const locale = await resolveEmailLocale(input.locale);
  const copy = emailCopy(locale).waitlistLaunch.family;
  const intakeUrl = `${appUrl}/family/intake`;
  const paragraphs = [emailGreeting(locale, input.contactName), ...copy.body];

  return {
    to: [{ email: input.email, name: input.contactName }],
    subject: copy.subject,
    htmlContent: renderTransactionalEmail({
      locale,
      preheader: copy.preheader,
      eyebrow: copy.eyebrow,
      title: copy.title,
      paragraphs,
      cta: { label: copy.cta, url: intakeUrl },
      footerNote: copy.footerNote
    }),
    textContent: [...paragraphs, `${copy.cta}: ${intakeUrl}`].join(" ")
  };
}

export async function buildWaitlistFacilityLaunchPayload(input: {
  contactName: string;
  email: string;
  facilityName?: string | null;
  locale?: Locale;
}) {
  const locale = await resolveEmailLocale(input.locale);
  const copy = emailCopy(locale).waitlistLaunch.facility;
  const providerLoginUrl = `${appUrl}/provider/login`;
  const greetingName = input.facilityName?.trim() || input.contactName;
  const paragraphs = [
    emailGreeting(locale, input.contactName),
    copy.intro,
    input.facilityName ? copy.named(input.facilityName) : copy.unnamed,
    copy.thanks
  ];

  return {
    to: [{ email: input.email, name: input.contactName }],
    subject: copy.subject,
    htmlContent: renderTransactionalEmail({
      locale,
      preheader: copy.preheader,
      eyebrow: copy.eyebrow,
      title: copy.title(greetingName),
      paragraphs,
      cta: { label: copy.cta, url: providerLoginUrl },
      footerNote: copy.footerNote
    }),
    textContent: [...paragraphs, `${copy.cta}: ${providerLoginUrl}`].join(" ")
  };
}

export async function sendWaitlistFamilyLaunchEmail(input: {
  contactName: string;
  email: string;
  locale?: Locale;
}) {
  return sendBrevoEmail(await buildWaitlistFamilyLaunchPayload(input));
}

export async function sendWaitlistFacilityLaunchEmail(input: {
  contactName: string;
  email: string;
  facilityName?: string | null;
  locale?: Locale;
}) {
  return sendBrevoEmail(await buildWaitlistFacilityLaunchPayload(input));
}
