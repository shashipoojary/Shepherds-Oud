import { sendBrevoEmail } from "@/lib/email/brevo";
import { shouldSendFamilyStatusEmail } from "@/lib/email/email-policy";
import { emailCopy, emailGreeting, formatEmailDateTime, resolveEmailLocale } from "@/lib/email/email-copy";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";
import { intakeStatusLabel, normalizeIntakeStatus } from "@/lib/domain/intake-workflow";
import type { Locale } from "@/lib/i18n/config";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

export async function sendIntakeStatusEmail(input: {
  contactName: string;
  email: string;
  intakeId: string;
  status: string;
  carePathway?: string | null;
  careGuide?: { name: string | null; email: string } | null;
  visitProviderName?: string | null;
  visitScheduledAt?: Date | null;
  locale?: Locale;
}) {
  const status = normalizeIntakeStatus(input.status);

  if (!shouldSendFamilyStatusEmail(status)) {
    return { skipped: true as const };
  }

  const locale = await resolveEmailLocale(input.locale);
  const copy = emailCopy(locale).intakeStatus;
  const guideName = input.careGuide?.name || copy.guideFallback;
  const dashboardUrl = `${appUrl}/family/dashboard?intakeId=${encodeURIComponent(input.intakeId)}`;
  const visitWhen =
    input.visitScheduledAt && !Number.isNaN(input.visitScheduledAt.getTime())
      ? formatEmailDateTime(locale, input.visitScheduledAt)
      : copy.agreedMoment;

  const messages: Partial<Record<string, { title: string; paragraphs: string[] }>> = {
    MATCHED: {
      title: copy.matched.title,
      paragraphs: [
        emailGreeting(locale, input.contactName),
        copy.matched.body,
        copy.matched.guide(guideName),
        copy.matched.ctaHint
      ]
    },
    VISIT_SCHEDULED: {
      title: copy.visit.title,
      paragraphs: [
        emailGreeting(locale, input.contactName),
        copy.visit.planned(guideName, input.visitProviderName),
        copy.visit.when(visitWhen),
        copy.visit.hint
      ]
    },
    PLACED: {
      title: copy.placed.title,
      paragraphs: [
        emailGreeting(locale, input.contactName),
        copy.placed.body,
        copy.placed.guide(guideName),
        copy.placed.hint
      ]
    }
  };

  const content = messages[status];
  if (!content) return { skipped: true as const };

  const reference = input.intakeId.slice(0, 8).toUpperCase();
  const statusLabel = intakeStatusLabel(status, locale);

  const htmlContent = renderTransactionalEmail({
    locale,
    preheader: content.title,
    eyebrow: copy.eyebrow,
    title: content.title,
    paragraphs: content.paragraphs,
    cta: { label: copy.cta, url: dashboardUrl },
    footerNote: copy.footer(reference, statusLabel)
  });

  await sendBrevoEmail({
    to: [{ email: input.email, name: input.contactName }],
    subject: `${content.title} — Shepherds Oud Care`,
    htmlContent,
    textContent: `${content.title}. ${content.paragraphs.join(" ")} Dashboard: ${dashboardUrl}`
  });

  return { sent: true as const };
}
