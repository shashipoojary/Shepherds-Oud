import { sendBrevoEmail } from "@/lib/email/brevo";
import { emailCopy, emailGreeting, formatEmailDate, resolveEmailLocale } from "@/lib/email/email-copy";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";
import type { Locale } from "@/lib/i18n/config";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

export async function sendProviderInviteEmail(input: {
  email: string;
  contactName: string;
  facilityName?: string | null;
  token: string;
  expiresAt: Date;
  locale?: Locale;
}) {
  const locale = await resolveEmailLocale(input.locale);
  const copy = emailCopy(locale).providerInvite;
  const inviteUrl = `${appUrl}/provider/login?invite=${encodeURIComponent(input.token)}`;
  const displayName = input.facilityName?.trim() || copy.facilityFallback;
  const expiresLabel = formatEmailDate(locale, input.expiresAt);
  const paragraphs = [
    emailGreeting(locale, input.contactName),
    copy.invited(displayName),
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
    console.info(`[dev] Provider invite for ${input.email}: ${inviteUrl}`);
  }

  return result;
}
