import { sendBrevoEmail } from "@/lib/email/brevo";
import { emailCopy, emailGreeting, resolveEmailLocale } from "@/lib/email/email-copy";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";
import type { Locale } from "@/lib/i18n/config";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

export type WaitlistAnnouncementAudience = "new" | "active";

export function renderAnnouncementTemplate(input: {
  contactName: string;
  facilityName?: string | null;
  message: string;
  type: "FAMILY" | "FACILITY";
  locale?: Locale;
}) {
  const locale = input.locale ?? "nl";
  const copy = emailCopy(locale).waitlistAnnouncement;
  const greetingName = input.contactName.trim() || copy.greetingFallback;
  const facilityLabel = input.facilityName?.trim() || copy.facilityFallback;
  const body = input.message
    .replaceAll("{{contactName}}", greetingName)
    .replaceAll("{{facilityName}}", facilityLabel)
    .trim();

  const paragraphs = [emailGreeting(locale, greetingName), body];

  const cta =
    input.type === "FAMILY"
      ? { label: copy.familyCta, url: `${appUrl}/family/intake` }
      : { label: copy.facilityCta, url: `${appUrl}/provider/login` };

  return {
    paragraphs,
    cta,
    footerNote: copy.footerNote,
    eyebrow: copy.eyebrow,
    textContent: [...paragraphs, "", `${cta.label}: ${cta.url}`].join("\n")
  };
}

export async function sendWaitlistAnnouncementEmail(input: {
  email: string;
  contactName: string;
  facilityName?: string | null;
  type: "FAMILY" | "FACILITY";
  subject: string;
  message: string;
  locale?: Locale;
}) {
  const locale = await resolveEmailLocale(input.locale);
  const content = renderAnnouncementTemplate({
    contactName: input.contactName,
    facilityName: input.facilityName,
    message: input.message,
    type: input.type,
    locale
  });

  const htmlContent = renderTransactionalEmail({
    locale,
    preheader: input.subject,
    eyebrow: content.eyebrow,
    title: input.subject,
    paragraphs: content.paragraphs,
    cta: content.cta,
    footerNote: content.footerNote
  });

  return sendBrevoEmail({
    to: [{ email: input.email, name: input.contactName }],
    subject: input.subject,
    htmlContent,
    textContent: content.textContent
  });
}
