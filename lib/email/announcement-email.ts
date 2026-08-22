import { sendBrevoEmail } from "@/lib/email/brevo";
import { emailCopy, emailGreeting, resolveEmailLocale } from "@/lib/email/email-copy";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";
import {
  ANNOUNCEMENT_CONTACT_TOKEN,
  ANNOUNCEMENT_FACILITY_TOKEN
} from "@/lib/email/announcement-types";
import type { Locale } from "@/lib/i18n/config";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

export type AnnouncementRecipientKind = "FAMILY" | "FACILITY" | "PROVIDER";

export { ANNOUNCEMENT_CONTACT_TOKEN, ANNOUNCEMENT_FACILITY_TOKEN };

/** Strip merge tokens so admins cannot depend on typing them in the message body. */
export function stripAnnouncementTokens(message: string) {
  return message
    .replaceAll(ANNOUNCEMENT_CONTACT_TOKEN, "")
    .replaceAll(ANNOUNCEMENT_FACILITY_TOKEN, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function renderAnnouncementTemplate(input: {
  contactName: string;
  facilityName?: string | null;
  message: string;
  kind: AnnouncementRecipientKind;
  locale?: Locale;
}) {
  const locale = input.locale ?? "nl";
  const copy = emailCopy(locale).announcement;
  const greetingName = input.contactName.trim() || copy.greetingFallback;
  const facilityLabel = input.facilityName?.trim() || copy.facilityFallback;
  const body = stripAnnouncementTokens(input.message);

  const paragraphs = [emailGreeting(locale, greetingName)];

  if ((input.kind === "FACILITY" || input.kind === "PROVIDER") && facilityLabel) {
    paragraphs.push(copy.facilityLine(facilityLabel));
  }

  if (body) {
    paragraphs.push(body);
  }

  const cta =
    input.kind === "PROVIDER" || input.kind === "FACILITY"
      ? { label: copy.providerCta, url: `${appUrl}/provider/login` }
      : { label: copy.familyCta, url: `${appUrl}/family/dashboard` };

  return {
    paragraphs,
    cta,
    footerNote: copy.footerNote(input.kind),
    eyebrow: copy.eyebrow,
    textContent: [...paragraphs, "", `${cta.label}: ${cta.url}`].join("\n")
  };
}

export async function sendAnnouncementEmail(input: {
  email: string;
  contactName: string;
  facilityName?: string | null;
  kind: AnnouncementRecipientKind;
  subject: string;
  message: string;
  locale?: Locale;
}) {
  const payload = await buildAnnouncementBrevoPayload(input);
  return sendBrevoEmail(payload);
}

export async function buildAnnouncementBrevoPayload(input: {
  email: string;
  contactName: string;
  facilityName?: string | null;
  kind: AnnouncementRecipientKind;
  subject: string;
  message: string;
  locale?: Locale;
}) {
  const locale = await resolveEmailLocale(input.locale);
  const content = renderAnnouncementTemplate({
    contactName: input.contactName,
    facilityName: input.facilityName,
    message: input.message,
    kind: input.kind,
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

  return {
    to: [{ email: input.email, name: input.contactName }],
    subject: input.subject,
    htmlContent,
    textContent: content.textContent
  };
}

/** @deprecated Prefer sendAnnouncementEmail */
export async function sendWaitlistAnnouncementEmail(input: {
  email: string;
  contactName: string;
  facilityName?: string | null;
  type: "FAMILY" | "FACILITY";
  subject: string;
  message: string;
  locale?: Locale;
}) {
  return sendAnnouncementEmail({
    email: input.email,
    contactName: input.contactName,
    facilityName: input.facilityName,
    kind: input.type,
    subject: input.subject,
    message: input.message,
    locale: input.locale
  });
}
