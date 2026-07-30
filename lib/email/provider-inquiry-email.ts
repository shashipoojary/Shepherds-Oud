import { sendBrevoEmail } from "@/lib/email/brevo";
import { emailCopy, emailGreeting, resolveEmailLocale } from "@/lib/email/email-copy";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";
import type { Locale } from "@/lib/i18n/config";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

/** Provider-only alert when a family requests a visit or callback (action required). */
export async function sendProviderInquiryEmail(input: {
  providerEmail: string;
  providerName: string;
  familyName: string;
  familyArea: string;
  familyCare: string;
  familyUrgency: string;
  requestType: "VISIT_REQUESTED" | "CALLBACK_REQUESTED";
  locale?: Locale;
}) {
  const locale = await resolveEmailLocale(input.locale);
  const copy = emailCopy(locale).providerInquiry;
  const dashboardUrl = `${appUrl}/provider`;
  const isVisit = input.requestType === "VISIT_REQUESTED";
  const title = isVisit ? copy.visitTitle : copy.callbackTitle;

  const paragraphs = [
    emailGreeting(locale, input.providerName),
    copy.body(input.familyName, input.familyArea, isVisit),
    copy.details(input.familyCare, input.familyUrgency),
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
    textContent: paragraphs.join(" ")
  });
}
