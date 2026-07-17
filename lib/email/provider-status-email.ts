import { brandTagline } from "@/lib/config/brand";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { emailCopy, emailGreeting, formatEmailDateTime, resolveEmailLocale } from "@/lib/email/email-copy";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";
import type { Locale } from "@/lib/i18n/config";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

type ProviderStatusKind = "visit_scheduled" | "care_chosen";

export async function sendProviderStatusEmail(input: {
  providerEmail: string;
  providerName: string;
  familyName: string;
  kind: ProviderStatusKind;
  visitScheduledAt?: Date | null;
  visitType?: string | null;
  visitNotes?: string | null;
  locale?: Locale;
}) {
  const locale = await resolveEmailLocale(input.locale);
  const copy = emailCopy(locale).providerStatus;
  const dashboardUrl = `${appUrl}/provider`;
  const isVisit = input.kind === "visit_scheduled";
  const title = isVisit ? copy.visitTitle : copy.chosenTitle;
  const visitLine =
    input.visitScheduledAt && !Number.isNaN(input.visitScheduledAt.getTime())
      ? copy.visitWhen(formatEmailDateTime(locale, input.visitScheduledAt))
      : copy.visitOpenDashboard;

  const paragraphs = isVisit
    ? [
        emailGreeting(locale, input.providerName),
        copy.visitPlanned(input.familyName),
        `${input.visitType || copy.visitDefaultType} — ${visitLine}`,
        input.visitNotes ? copy.notes(input.visitNotes) : copy.visitHint
      ]
    : [
        emailGreeting(locale, input.providerName),
        copy.chosenBody(input.familyName),
        copy.chosenGuide,
        copy.chosenHint
      ];

  const htmlContent = renderTransactionalEmail({
    locale,
    preheader: title,
    eyebrow: copy.eyebrow,
    title,
    paragraphs,
    cta: { label: copy.cta, url: dashboardUrl },
    footerNote: copy.footerTagline(brandTagline(locale))
  });

  return sendBrevoEmail({
    to: [{ email: input.providerEmail, name: input.providerName }],
    subject: `${title} — Shepherds Oud`,
    htmlContent,
    textContent: `${title}. ${paragraphs.join(" ")} Dashboard: ${dashboardUrl}`
  });
}
