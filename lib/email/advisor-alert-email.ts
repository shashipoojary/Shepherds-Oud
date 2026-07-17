import { brand } from "@/lib/config/brand";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { advisorAlertSubject } from "@/lib/email/email-policy";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

export async function sendAdvisorAlertEmail(input: {
  kind: Parameters<typeof advisorAlertSubject>[0];
  detail: string;
  paragraphs: string[];
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  const advisorEmail = process.env.ADVISOR_EMAIL;
  if (!advisorEmail) {
    return { mode: "demo" as const, skipped: true };
  }

  const subject = advisorAlertSubject(input.kind, input.detail);
  const adminUrl = `${appUrl}/admin`;

  const htmlContent = renderTransactionalEmail({
    locale: "en",
    preheader: subject,
    eyebrow: "Care Guide team",
    title: subject,
    paragraphs: input.paragraphs,
    cta: {
      label: input.ctaLabel || "Open admin dashboard",
      url: input.ctaUrl || adminUrl
    },
    footerNote: `${brand.name} internal alert — no reply needed unless follow-up is required.`
  });

  return sendBrevoEmail({
    to: [{ email: advisorEmail, name: "Shepherds Oud Care Guide team" }],
    subject,
    htmlContent,
    textContent: `${subject}. ${input.paragraphs.join(" ")} ${input.ctaUrl || adminUrl}`
  });
}
