import { sendBrevoEmail } from "@/lib/email/brevo";
import { emailCopy, emailGreeting, resolveEmailLocale } from "@/lib/email/email-copy";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";
import type { Locale } from "@/lib/i18n/config";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

export async function sendWaitlistConfirmationEmails(input: {
  contactName: string;
  email: string;
  type: "FAMILY" | "FACILITY";
  locale?: Locale;
}) {
  const locale = await resolveEmailLocale(input.locale);
  const copy = emailCopy(locale).waitlist;
  const paragraphs = [
    emailGreeting(locale, input.contactName),
    copy.thanks,
    input.type === "FACILITY" ? copy.facility : copy.family
  ];

  const htmlContent = renderTransactionalEmail({
    locale,
    preheader: copy.preheader,
    eyebrow: copy.eyebrow,
    title: copy.title,
    paragraphs,
    cta: { label: copy.cta, url: appUrl },
    footerNote: copy.footerNote
  });

  await sendBrevoEmail({
    to: [{ email: input.email, name: input.contactName }],
    subject: copy.subject,
    htmlContent,
    textContent: paragraphs.join(" ")
  });
}
