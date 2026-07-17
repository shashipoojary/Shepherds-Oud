import { siteTagline } from "@/lib/config/marketing-en";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { sendAdvisorAlertEmail } from "@/lib/email/advisor-alert-email";
import { emailCopy, emailGreeting, resolveEmailLocale } from "@/lib/email/email-copy";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";
import type { Locale } from "@/lib/i18n/config";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

export async function sendIntakeConfirmationEmails(input: {
  contactName: string;
  email: string;
  intakeId: string;
  careGuide: { name: string | null; email: string } | null;
  locale?: Locale;
}) {
  const locale = await resolveEmailLocale(input.locale);
  const copy = emailCopy(locale).intakeConfirmation;
  const dashboardUrl = `${appUrl}/family/dashboard`;
  const reference = input.intakeId.slice(0, 8).toUpperCase();
  const guideName = input.careGuide?.name || copy.guideFallback;

  const paragraphs = input.careGuide
    ? [
        emailGreeting(locale, input.contactName),
        copy.received(reference),
        copy.guideAssigned(guideName, input.careGuide.email),
        siteTagline(locale)
      ]
    : [
        emailGreeting(locale, input.contactName),
        copy.received(reference),
        copy.guidePending,
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
      textContent: paragraphs.join(" ")
    }),
    sendAdvisorAlertEmail({
      kind: "new_intake",
      detail: input.contactName,
      paragraphs: [
        `A new intake was submitted by ${input.contactName} (${input.email}).`,
        `Reference: ${reference}.`,
        input.careGuide ? `Assigned Care Guide: ${guideName}.` : "No Care Guide assigned yet."
      ]
    })
  ]);
}
