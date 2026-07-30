import { sendBrevoEmail } from "@/lib/email/brevo";
import { emailCopy, emailGreeting, resolveEmailLocale } from "@/lib/email/email-copy";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";
import type { Locale } from "@/lib/i18n/config";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

/** Family notification when a Care Guide adds or re-opens a provider match. */
export async function sendFamilyMatchCreatedEmail(input: {
  contactName: string;
  email: string;
  intakeId: string;
  providerName: string;
  reopened?: boolean;
  locale?: Locale;
}) {
  const locale = await resolveEmailLocale(input.locale);
  const copy = emailCopy(locale).familyMatch;
  const dashboardUrl = `${appUrl}/family/dashboard?intakeId=${encodeURIComponent(input.intakeId)}`;
  const resultsUrl = `${appUrl}/family/results?intakeId=${encodeURIComponent(input.intakeId)}`;
  const title = input.reopened ? copy.reopenedTitle(input.providerName) : copy.newTitle(input.providerName);
  const body = input.reopened ? copy.reopenedBody(input.providerName) : copy.newBody(input.providerName);
  const paragraphs = [emailGreeting(locale, input.contactName), ...body];

  const htmlContent = renderTransactionalEmail({
    locale,
    preheader: title,
    eyebrow: copy.eyebrow,
    title,
    paragraphs,
    cta: { label: copy.cta, url: resultsUrl },
    footerNote: copy.footer(dashboardUrl)
  });

  return sendBrevoEmail({
    to: [{ email: input.email, name: input.contactName }],
    subject: `${title} — Shepherds Oud Care`,
    htmlContent,
    textContent: `${title}. ${paragraphs.join(" ")} Matches: ${resultsUrl}`
  });
}

/** Provider notification when they are added or re-opened as a potential referral. */
export async function sendProviderMatchCreatedEmail(input: {
  providerEmail: string;
  providerName: string;
  familyArea: string;
  familyCare: string;
  familyUrgency: string;
  reopened?: boolean;
  locale?: Locale;
}) {
  const locale = await resolveEmailLocale(input.locale);
  const copy = emailCopy(locale).providerMatch;
  const dashboardUrl = `${appUrl}/provider`;
  const title = input.reopened ? copy.reopenedTitle : copy.newTitle;

  const paragraphs = [
    emailGreeting(locale, input.providerName),
    input.reopened ? copy.reopenedBody : copy.newBody,
    copy.details(input.familyArea, input.familyCare, input.familyUrgency),
    copy.hint
  ];

  const htmlContent = renderTransactionalEmail({
    locale,
    preheader: title,
    eyebrow: copy.eyebrow,
    title,
    paragraphs,
    cta: { label: copy.cta, url: dashboardUrl },
    footerNote: copy.footer
  });

  return sendBrevoEmail({
    to: [{ email: input.providerEmail, name: input.providerName }],
    subject: `${title} — Shepherds Oud Care`,
    htmlContent,
    textContent: `${title}. ${paragraphs.join(" ")} Dashboard: ${dashboardUrl}`
  });
}
