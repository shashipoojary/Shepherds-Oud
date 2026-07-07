import { sendBrevoEmail } from "@/lib/email/brevo";
import { shouldSendFamilyStatusEmail } from "@/lib/email/email-policy";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";
import { intakeStatusLabel, normalizeIntakeStatus } from "@/lib/domain/intake-workflow";

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
}) {
  const status = normalizeIntakeStatus(input.status);

  if (!shouldSendFamilyStatusEmail(status)) {
    return { skipped: true as const };
  }

  const guideName = input.careGuide?.name || "Your Care Guide";
  const dashboardUrl = `${appUrl}/family/dashboard?intakeId=${encodeURIComponent(input.intakeId)}`;
  const visitWhen =
    input.visitScheduledAt && !Number.isNaN(input.visitScheduledAt.getTime())
      ? input.visitScheduledAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
      : "the agreed time";

  const messages: Partial<Record<string, { title: string; paragraphs: string[] }>> = {
    MATCHED: {
      title: "Your provider shortlist is ready",
      paragraphs: [
        `Hello ${input.contactName},`,
        "Matched providers are now on your shortlist — the main update in your guided journey.",
        `${guideName} is here if you have questions while you compare options together.`,
        "Open your dashboard to review matches and request visits."
      ]
    },
    VISIT_SCHEDULED: {
      title: "Your visit or callback is scheduled",
      paragraphs: [
        `Hello ${input.contactName},`,
        `${guideName} has scheduled the next step${input.visitProviderName ? ` with ${input.visitProviderName}` : ""}.`,
        `Timing: ${visitWhen}.`,
        "Open your dashboard to review the details and any notes from your Care Guide."
      ]
    },
    PLACED: {
      title: "Care has been arranged",
      paragraphs: [
        `Hello ${input.contactName},`,
        "We are glad to share that care has been arranged.",
        `${guideName} remains available if you need support during the transition.`,
        "Your dashboard has the latest details."
      ]
    }
  };

  const content = messages[status];
  if (!content) return { skipped: true as const };

  const htmlContent = renderTransactionalEmail({
    preheader: content.title,
    eyebrow: "Your guided care journey",
    title: content.title,
    paragraphs: content.paragraphs,
    cta: { label: "Open your dashboard", url: dashboardUrl },
    footerNote: `Reference ${input.intakeId.slice(0, 8).toUpperCase()} · Status: ${intakeStatusLabel(status)}`
  });

  await sendBrevoEmail({
    to: [{ email: input.email, name: input.contactName }],
    subject: `${content.title} — Shepherds Oud`,
    htmlContent,
    textContent: `${content.title}. ${content.paragraphs.join(" ")} Dashboard: ${dashboardUrl}`
  });

  return { sent: true as const };
}
