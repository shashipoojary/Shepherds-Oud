import { sendBrevoEmail } from "@/lib/email/brevo";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";
import { intakeStatusLabel, normalizeIntakeStatus } from "@/lib/intake-workflow";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

export async function sendIntakeStatusEmail(input: {
  contactName: string;
  email: string;
  intakeId: string;
  status: string;
  carePathway?: string | null;
  careGuide?: { name: string | null; email: string } | null;
}) {
  const status = normalizeIntakeStatus(input.status);
  const guideName = input.careGuide?.name || "Your Care Guide";
  const dashboardUrl = `${appUrl}/family/dashboard`;

  const messages: Partial<Record<string, { title: string; paragraphs: string[] }>> = {
    ASSESSMENT: {
      title: "Your assessment has started",
      paragraphs: [
        `Hello ${input.contactName},`,
        `${guideName} is reviewing your care request and preparing a recommended pathway for you.`,
        "We will update you when provider matches are ready on your dashboard."
      ]
    },
    MATCHED: {
      title: "Provider matches are ready",
      paragraphs: [
        `Hello ${input.contactName},`,
        input.carePathway
          ? `Your recommended care pathway is ${input.carePathway}. Matched providers are now on your shortlist.`
          : "Matched providers are now on your shortlist.",
        `${guideName} is here if you have questions while you review your options.`
      ]
    },
    VISIT_SCHEDULED: {
      title: "Your facility visit is scheduled",
      paragraphs: [
        `Hello ${input.contactName},`,
        "A facility visit has been scheduled. This is an important step in your care journey.",
        `${guideName} will support you with next steps and timing details.`
      ]
    },
    PLACEMENT_IN_PROGRESS: {
      title: "Placement is in progress",
      paragraphs: [
        `Hello ${input.contactName},`,
        "Your family is moving forward with placement. Your Care Guide remains available if you need support.",
        "Check your dashboard for the latest updates."
      ]
    },
    PLACED: {
      title: "Care has been arranged",
      paragraphs: [
        `Hello ${input.contactName},`,
        "We are glad to share that care has been arranged for your family.",
        `${guideName} can help with any final questions during this transition.`
      ]
    }
  };

  const content = messages[status];
  if (!content) return { skipped: true as const };

  const htmlContent = renderTransactionalEmail({
    preheader: content.title,
    eyebrow: "Your care journey",
    title: content.title,
    paragraphs: content.paragraphs,
    ctaLabel: "Open your dashboard",
    ctaUrl: dashboardUrl,
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
