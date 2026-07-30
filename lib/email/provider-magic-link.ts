import { brandTagline } from "@/lib/config/brand";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { emailCopy, resolveEmailLocale } from "@/lib/email/email-copy";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";
import type { Locale } from "@/lib/i18n/config";

export async function sendProviderMagicLinkEmail(email: string, url: string, localeHint?: Locale) {
  const locale = await resolveEmailLocale(localeHint);
  const copy = emailCopy(locale).providerMagicLink;
  const tagline = brandTagline(locale);

  const textContent = [
    copy.textLead,
    "",
    copy.textBody,
    url,
    "",
    copy.textExpiry,
    "",
    `Shepherds Oud — ${tagline}`
  ].join("\n");

  const htmlContent = renderTransactionalEmail({
    locale,
    preheader: copy.preheader,
    eyebrow: copy.eyebrow,
    title: copy.title,
    paragraphs: copy.paragraphs,
    cta: { label: copy.cta, url },
    footerNote: copy.footerNote
  });

  const result = await sendBrevoEmail({
    to: [{ email }],
    subject: copy.subject,
    htmlContent,
    textContent
  });

  return result;
}
